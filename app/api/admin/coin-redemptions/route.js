import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch coin redemption requests.
 * Verifies the JWT token from the request headers and fetches the redemption requests.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the redemption requests or an error message.
 */
export async function GET(req) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Verify admin access
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!admin) {
      return Response.json({
        message: "Admin not found",
        success: false,
        data: {},
      });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");
    const requestType = searchParams.get("requestType");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (requestType) {
      whereClause.request_type = requestType;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    // Handle search functionality
    if (search && search.trim() !== "") {
      whereClause.OR = [
        {
          user: {
            firstname: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            lastname: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            mobileno: { contains: search, mode: "insensitive" },
          },
        },
        {
          admin_notes: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // Fetch coin redemption requests with pagination
    const redemptions = await prisma.coinRedemption.findMany({
      where: whereClause,
      orderBy: {
        createddate: "desc",
      },
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      take: limit ? parseInt(limit) : 10,
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
            userSteps: {
              select: {
                total_coins: true,
                redeemed_coins: true,
                available_coins: true,
              },
            },
          },
        },
        history: {
          orderBy: {
            createddate: "desc",
          },
          take: 5,
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

    // Calculate statistics
    const stats = await prisma.coinRedemption.aggregate({
      where: whereClause,
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
      message: "Coin redemption requests fetched successfully",
      success: true,
      data: redemptions,
      statistics: {
        totalRequests: stats._count.id,
        totalCoinsRequested: stats._sum.coins_requested || 0,
        totalAmountRequested: stats._sum.amount_requested || 0,
        totalCoinsApproved: stats._sum.coins_approved || 0,
        totalAmountApproved: stats._sum.amount_approved || 0,
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
 * Handles the POST request to create a new coin redemption request (admin can create on behalf of user).
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

    // Verify admin access
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!admin) {
      return Response.json({
        message: "Admin not found",
        success: false,
        data: {},
      });
    }

    // Parse request body
    const body = await req.json();

    // Validation rules
    const ValidatorRules = {
      userId: "required",
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: body.userId,
        status: 1,
      },
      include: {
        userSteps: true,
      },
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    // Check if user has enough coins
    if (!user.userSteps || user.userSteps.available_coins < body.coins_requested) {
      return Response.json({
        success: false,
        message: "Insufficient coins available for redemption",
        data: {
          available_coins: user.userSteps?.available_coins || 0,
          requested_coins: body.coins_requested,
        },
      });
    }

    // Create new coin redemption request
    const newRedemption = await prisma.coinRedemption.create({
      data: {
        userId: body.userId,
        coins_requested: parseInt(body.coins_requested),
        amount_requested: parseFloat(body.amount_requested),
        currency: body.currency || "USD",
        status: body.status || "pending",
        request_type: body.request_type,
        payment_method: body.payment_method,
        payment_details: body.payment_details,
        admin_notes: body.admin_notes,
        processed_by: body.status === "approved" || body.status === "rejected" ? tokenData.data.id : null,
        processed_at: body.status === "approved" || body.status === "rejected" ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
            userSteps: {
              select: {
                total_coins: true,
                redeemed_coins: true,
                available_coins: true,
              },
            },
          },
        },
      },
    });

    // Create history entry
    await prisma.coinRedemptionHistory.create({
      data: {
        userId: body.userId,
        redemptionId: newRedemption.id,
        action: "created",
        coins_amount: parseInt(body.coins_requested),
        amount_value: parseFloat(body.amount_requested),
        currency: body.currency || "USD",
        notes: body.admin_notes || "Redemption request created",
        performed_by: tokenData.data.id,
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
 * Handles the PUT request to update a coin redemption request.
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

    // Verify admin access
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!admin) {
      return Response.json({
        message: "Admin not found",
        success: false,
        data: {},
      });
    }

    // Parse request body
    const body = await req.json();

    // Validation rules
    const ValidatorRules = {
      id: "required",
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

    // Check if redemption exists
    const existingRedemption = await prisma.coinRedemption.findUnique({
      where: {
        id: body.id,
      },
      include: {
        user: {
          include: {
            userSteps: true,
          },
        },
      },
    });

    if (!existingRedemption) {
      return Response.json({
        success: false,
        message: "Coin redemption request not found",
        data: {},
      });
    }

    // Prepare update data
    const updateData = {};
    const historyData = {
      userId: existingRedemption.userId,
      redemptionId: body.id,
      performed_by: tokenData.data.id,
    };

    // Handle status changes
    if (body.status && body.status !== existingRedemption.status) {
      updateData.status = body.status;
      updateData.processed_by = tokenData.data.id;
      updateData.processed_at = new Date();
      
      historyData.action = body.status;
      historyData.coins_amount = body.coins_approved || existingRedemption.coins_requested;
      historyData.amount_value = body.amount_approved || existingRedemption.amount_requested;
      historyData.currency = existingRedemption.currency;
      historyData.notes = body.admin_notes || `Status changed to ${body.status}`;

      // If approved, update user's coin balance
      if (body.status === "approved") {
        const approvedCoins = body.coins_approved || existingRedemption.coins_requested;
        const approvedAmount = body.amount_approved || existingRedemption.amount_requested;
        
        updateData.coins_approved = approvedCoins;
        updateData.amount_approved = approvedAmount;

        // Update user's coin balance
        await prisma.userSteps.update({
          where: {
            userId: existingRedemption.userId,
          },
          data: {
            redeemed_coins: {
              increment: approvedCoins,
            },
            available_coins: {
              decrement: approvedCoins,
            },
            last_redeem_at: new Date(),
          },
        });
      }
    }

    // Update other fields
    if (body.coins_approved !== undefined) updateData.coins_approved = parseInt(body.coins_approved);
    if (body.amount_approved !== undefined) updateData.amount_approved = parseFloat(body.amount_approved);
    if (body.payment_method) updateData.payment_method = body.payment_method;
    if (body.payment_details) updateData.payment_details = body.payment_details;
    if (body.admin_notes) updateData.admin_notes = body.admin_notes;

    // Update coin redemption request
    const updatedRedemption = await prisma.coinRedemption.update({
      where: {
        id: body.id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
            userSteps: {
              select: {
                total_coins: true,
                redeemed_coins: true,
                available_coins: true,
              },
            },
          },
        },
        history: {
          orderBy: {
            createddate: "desc",
          },
          take: 5,
        },
      },
    });

    // Create history entry if there were changes
    if (Object.keys(updateData).length > 0) {
      await prisma.coinRedemptionHistory.create({
        data: historyData,
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
 * Handles the DELETE request to cancel a coin redemption request.
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

    // Verify admin access
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
      },
    });

    if (!admin) {
      return Response.json({
        message: "Admin not found",
        success: false,
        data: {},
      });
    }

    // Get the redemption id from the URL parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Define validation rules
    const ValidatorRules = {
      id: "required",
    };

    // Validate the redemption id parameter
    const { error, status } = await new Promise((resolve) => {
      validator({ id }, ValidatorRules, {}, (error, status) => {
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

    // Check if redemption exists
    const redemption = await prisma.coinRedemption.findUnique({
      where: {
        id: id,
      },
    });

    if (!redemption) {
      return Response.json({
        success: false,
        message: "Coin redemption request not found",
        data: {},
      });
    }

    // Check if redemption can be cancelled (only pending requests)
    if (redemption.status !== "pending") {
      return Response.json({
        success: false,
        message: "Only pending redemption requests can be cancelled",
        data: {},
      });
    }

    // Cancel the redemption (update status to cancelled)
    await prisma.coinRedemption.update({
      where: {
        id: id,
      },
      data: {
        status: "cancelled",
        processed_by: tokenData.data.id,
        processed_at: new Date(),
      },
    });

    // Create history entry
    await prisma.coinRedemptionHistory.create({
      data: {
        userId: redemption.userId,
        redemptionId: id,
        action: "cancelled",
        coins_amount: redemption.coins_requested,
        amount_value: redemption.amount_requested,
        currency: redemption.currency,
        notes: "Redemption request cancelled by admin",
        performed_by: tokenData.data.id,
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
