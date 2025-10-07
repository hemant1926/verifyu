import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch user subscriptions.
 * Verifies the JWT token from the request headers and fetches the user subscriptions.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the user subscriptions or an error message.
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
    const paymentStatus = searchParams.get("paymentStatus");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
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
          plan: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Fetch user subscriptions with pagination
    const subscriptions = await prisma.userSubscription.findMany({
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
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            duration_days: true,
            features: true,
          },
        },
      },
    });

    const total = await prisma.userSubscription.count({
      where: whereClause,
    });

    return Response.json({
      message: "User subscriptions fetched successfully",
      success: true,
      data: subscriptions,
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
 * Handles the POST request to create a new user subscription.
 * Validates the incoming request data and creates a new user subscription.
 * 
 * @param {Request} req - The incoming request object containing subscription data.
 * @returns {Response} A JSON response indicating the result of the subscription creation process.
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
      planId: "required",
      startDate: "required",
      endDate: "required",
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
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    // Check if plan exists and is active
    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: body.planId,
        is_active: true,
      },
    });

    if (!plan) {
      return Response.json({
        success: false,
        message: "Subscription plan not found or inactive",
        data: {},
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: body.userId,
        status: "active",
      },
    });

    if (existingSubscription) {
      return Response.json({
        success: false,
        message: "User already has an active subscription",
        data: {},
      });
    }

    // Create new user subscription
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId: body.userId,
        planId: body.planId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: body.status || "active",
        paymentStatus: body.paymentStatus || "paid",
        paymentId: body.paymentId,
        paymentMethod: body.paymentMethod,
        autoRenew: body.autoRenew || false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            duration_days: true,
            features: true,
          },
        },
      },
    });

    return Response.json({
      message: "User subscription created successfully",
      success: true,
      data: newSubscription,
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
 * Handles the PUT request to update a user subscription.
 * 
 * @param {Request} req - The request object containing subscription data.
 * @returns {Response} A JSON response with the status of the operation and updated subscription details.
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

    // Check if subscription exists
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!existingSubscription) {
      return Response.json({
        success: false,
        message: "User subscription not found",
        data: {},
      });
    }

    // Prepare update data
    const updateData = {};
    if (body.status) updateData.status = body.status;
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.paymentId) updateData.paymentId = body.paymentId;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.autoRenew !== undefined) updateData.autoRenew = body.autoRenew;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    // Update user subscription
    const updatedSubscription = await prisma.userSubscription.update({
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
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            duration_days: true,
            features: true,
          },
        },
      },
    });

    return Response.json({
      message: "User subscription updated successfully",
      success: true,
      data: updatedSubscription,
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
 * Handles the DELETE request to cancel a user subscription.
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

    // Get the subscription id from the URL parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Define validation rules
    const ValidatorRules = {
      id: "required",
    };

    // Validate the subscription id parameter
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

    // Check if subscription exists
    const subscription = await prisma.userSubscription.findUnique({
      where: {
        id: id,
      },
    });

    if (!subscription) {
      return Response.json({
        success: false,
        message: "User subscription not found",
        data: {},
      });
    }

    // Cancel the subscription (update status to cancelled)
    await prisma.userSubscription.update({
      where: {
        id: id,
      },
      data: {
        status: "cancelled",
      },
    });

    return Response.json({
      message: "User subscription cancelled successfully",
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
