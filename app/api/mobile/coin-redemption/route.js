import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch user's coin redemption requests and coin balance.
 * Verifies the JWT token from the request headers and fetches the redemption data.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the redemption data or an error message.
 */
export async function GET(req) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Verify user access
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
      include: {
        userSteps: true,
      },
    });

    if (!user) {
      return Response.json({
        message: "User not found",
        success: false,
        data: {},
      });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // "requests" or "balance"

    if (type === "balance") {
      // Return only coin balance information
      return Response.json({
        message: "Coin balance fetched successfully",
        success: true,
        data: {
          total_coins: user.userSteps?.total_coins || 0,
          redeemed_coins: user.userSteps?.redeemed_coins || 0,
          available_coins: user.userSteps?.available_coins || 0,
          pending_redeem: user.userSteps?.pending_redeem || 0,
          is_redeem_blocked: user.userSteps?.is_redeem_blocked || false,
          block_reason: user.userSteps?.block_reason || "",
          last_redeem_at: user.userSteps?.last_redeem_at,
        },
      });
    }

    // Build where clause for redemption requests
    const whereClause = {
      userId: tokenData.data.id,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch user's coin redemption requests with pagination
    const redemptions = await prisma.coinRedemption.findMany({
      where: whereClause,
      orderBy: {
        createddate: "desc",
      },
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      take: limit ? parseInt(limit) : 10,
      include: {
        history: {
          orderBy: {
            createddate: "desc",
          },
          take: 3,
        },
        _count: {
          select: {
            history: true,
          },
        },
      },
    });

    const total = await prisma.coinRedemption.count({
      where: whereClause,
    });

    // Calculate redemption statistics
    const stats = await prisma.coinRedemption.aggregate({
      where: {
        userId: tokenData.data.id,
      },
      _count: {
        id: true,
      },
      _sum: {
        coins_requested: true,
        amount_requested: true,
        coins_approved: true,
        amount_approved: true,
      },
    });

    return Response.json({
      message: "Coin redemption data fetched successfully",
      success: true,
      data: {
        coinBalance: {
          total_coins: user.userSteps?.total_coins || 0,
          redeemed_coins: user.userSteps?.redeemed_coins || 0,
          available_coins: user.userSteps?.available_coins || 0,
          pending_redeem: user.userSteps?.pending_redeem || 0,
          is_redeem_blocked: user.userSteps?.is_redeem_blocked || false,
          block_reason: user.userSteps?.block_reason || "",
          last_redeem_at: user.userSteps?.last_redeem_at,
        },
        redemptions,
        statistics: {
          totalRequests: stats._count.id,
          totalCoinsRequested: stats._sum.coins_requested || 0,
          totalAmountRequested: stats._sum.amount_requested || 0,
          totalCoinsApproved: stats._sum.coins_approved || 0,
          totalAmountApproved: stats._sum.amount_approved || 0,
        },
      },
      totalResults: total,
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        totalPages: Math.ceil(total / (limit ? parseInt(limit) : 10)),
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      message: error.message,
      success: false,
      data: {},
    });
  }
}

/**
 * Handles the POST request to create a new coin redemption request.
 * Validates the incoming request data and creates a new redemption request.
 * 
 * @param {Request} req - The incoming request object containing redemption data.
 * @returns {Response} A JSON response indicating the result of the redemption creation process.
 */
export async function POST(req) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Verify user access
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
      include: {
        userSteps: true,
      },
    });

    if (!user) {
      return Response.json({
        message: "User not found",
        success: false,
        data: {},
      });
    }

    // Check if user is blocked from redemption
    if (user.userSteps?.is_redeem_blocked) {
      return Response.json({
        success: false,
        message: "Redemption is currently blocked",
        data: {
          block_reason: user.userSteps.block_reason,
        },
      });
    }

    // Parse request body
    const body = await req.json();

    // Validation rules
    const ValidatorRules = {
      coins_requested: "required|integer|min:1",
      amount_requested: "required|numeric|min:0",
      request_type: "required",
    };

    // Validate request data
    const { error, status } = await new Promise((resolve) => {
      validator(body, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check if user has enough coins
    const availableCoins = user.userSteps?.available_coins || 0;
    if (availableCoins < body.coins_requested) {
      return Response.json({
        success: false,
        message: "Insufficient coins available for redemption",
        data: {
          available_coins: availableCoins,
          requested_coins: body.coins_requested,
        },
      });
    }

    // Check daily redemption limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRedemptions = await prisma.coinRedemption.count({
      where: {
        userId: tokenData.data.id,
        createddate: {
          gte: today,
        },
        status: {
          in: ["pending", "approved"],
        },
      },
    });

    const dailyLimit = user.userSteps?.redeemed_limit_per_day || 0;
    if (dailyLimit > 0 && todayRedemptions >= dailyLimit) {
      return Response.json({
        success: false,
        message: "Daily redemption limit reached",
        data: {
          daily_limit: dailyLimit,
          today_redemptions: todayRedemptions,
        },
      });
    }

    // Create new coin redemption request
    const newRedemption = await prisma.coinRedemption.create({
      data: {
        userId: tokenData.data.id,
        coins_requested: parseInt(body.coins_requested),
        amount_requested: parseFloat(body.amount_requested),
        currency: body.currency || "USD",
        status: "pending",
        request_type: body.request_type,
        payment_method: body.payment_method,
        payment_details: body.payment_details,
      },
    });

    // Create history entry
    await prisma.coinRedemptionHistory.create({
      data: {
        userId: tokenData.data.id,
        redemptionId: newRedemption.id,
        action: "created",
        coins_amount: parseInt(body.coins_requested),
        amount_value: parseFloat(body.amount_requested),
        currency: body.currency || "USD",
        notes: "Redemption request created by user",
        performed_by: tokenData.data.id,
      },
    });

    // Update user's pending redemption count
    await prisma.userSteps.update({
      where: {
        userId: tokenData.data.id,
      },
      data: {
        pending_redeem: {
          increment: parseInt(body.coins_requested),
        },
      },
    });

    return Response.json({
      message: "Coin redemption request created successfully",
      success: true,
      data: newRedemption,
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      message: error.message,
      success: false,
      data: {},
    });
  }
}

/**
 * Handles the PUT request to update user's redemption request (limited fields).
 * 
 * @param {Request} req - The request object containing redemption update data.
 * @returns {Response} A JSON response with the status of the operation and updated redemption details.
 */
export async function PUT(req) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Verify user access
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!user) {
      return Response.json({
        message: "User not found",
        success: false,
        data: {},
      });
    }

    // Parse request body
    const body = await req.json();

    // Validation rules
    const ValidatorRules = {
      redemptionId: "required",
    };

    // Validate request data
    const { error, status } = await new Promise((resolve) => {
      validator(body, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check if redemption exists and belongs to the user
    const existingRedemption = await prisma.coinRedemption.findFirst({
      where: {
        id: body.redemptionId,
        userId: tokenData.data.id,
        status: "pending", // Only pending requests can be updated by user
      },
    });

    if (!existingRedemption) {
      return Response.json({
        success: false,
        message: "Pending redemption request not found or access denied",
        data: {},
      });
    }

    // Prepare update data (only allow certain fields to be updated by user)
    const updateData = {};
    if (body.payment_method) updateData.payment_method = body.payment_method;
    if (body.payment_details) updateData.payment_details = body.payment_details;

    // Update coin redemption request
    const updatedRedemption = await prisma.coinRedemption.update({
      where: {
        id: body.redemptionId,
      },
      data: updateData,
    });

    // Create history entry if there were changes
    if (Object.keys(updateData).length > 0) {
      await prisma.coinRedemptionHistory.create({
        data: {
          userId: tokenData.data.id,
          redemptionId: body.redemptionId,
          action: "updated",
          coins_amount: existingRedemption.coins_requested,
          amount_value: existingRedemption.amount_requested,
          currency: existingRedemption.currency,
          notes: "Redemption request updated by user",
          performed_by: tokenData.data.id,
        },
      });
    }

    return Response.json({
      message: "Coin redemption request updated successfully",
      success: true,
      data: updatedRedemption,
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      message: error.message,
      success: false,
      data: {},
    });
  }
}

/**
 * Handles the DELETE request to cancel user's redemption request.
 * 
 * @param {Request} req - The request object.
 * @returns {Promise<Response>} A promise that resolves to a Response object.
 */
export async function DELETE(req) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Verify user access
    const user = await prisma.user.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!user) {
      return Response.json({
        message: "User not found",
        success: false,
        data: {},
      });
    }

    // Get the redemption id from the URL parameters
    const { searchParams } = new URL(req.url);
    const redemptionId = searchParams.get("redemptionId");

    // Define validation rules
    const ValidatorRules = {
      redemptionId: "required",
    };

    // Validate the redemption id parameter
    const { error, status } = await new Promise((resolve) => {
      validator({ redemptionId }, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check if redemption exists and belongs to the user
    const redemption = await prisma.coinRedemption.findFirst({
      where: {
        id: redemptionId,
        userId: tokenData.data.id,
        status: "pending", // Only pending requests can be cancelled by user
      },
    });

    if (!redemption) {
      return Response.json({
        success: false,
        message: "Pending redemption request not found or access denied",
        data: {},
      });
    }

    // Cancel the redemption (update status to cancelled)
    await prisma.coinRedemption.update({
      where: {
        id: redemptionId,
      },
      data: {
        status: "cancelled",
        processed_at: new Date(),
      },
    });

    // Create history entry
    await prisma.coinRedemptionHistory.create({
      data: {
        userId: tokenData.data.id,
        redemptionId: redemptionId,
        action: "cancelled",
        coins_amount: redemption.coins_requested,
        amount_value: redemption.amount_requested,
        currency: redemption.currency,
        notes: "Redemption request cancelled by user",
        performed_by: tokenData.data.id,
      },
    });

    // Update user's pending redemption count
    await prisma.userSteps.update({
      where: {
        userId: tokenData.data.id,
      },
      data: {
        pending_redeem: {
          decrement: redemption.coins_requested,
        },
      },
    });

    return Response.json({
      message: "Coin redemption request cancelled successfully",
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      message: error.message,
      success: false,
      data: {},
    });
  }
}
