import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch available subscription plans and user's current subscription.
 * Verifies the JWT token from the request headers and fetches the subscription data.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the subscription plans and user's subscription or an error message.
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
    const type = searchParams.get("type"); // "plans" or "current"

    if (type === "plans") {
      // Fetch available subscription plans
      const plans = await prisma.subscriptionPlan.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          price: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          duration_days: true,
          features: true,
        },
      });

      return Response.json({
        message: "Subscription plans fetched successfully",
        success: true,
        data: plans,
      });
    } else if (type === "current") {
      // Fetch user's current subscription
      const currentSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: tokenData.data.id,
          status: "active",
        },
        include: {
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
        orderBy: {
          createddate: "desc",
        },
      });

      return Response.json({
        message: "Current subscription fetched successfully",
        success: true,
        data: currentSubscription,
      });
    } else {
      // Fetch both plans and current subscription
      const [plans, currentSubscription] = await Promise.all([
        prisma.subscriptionPlan.findMany({
          where: {
            is_active: true,
          },
          orderBy: {
            price: "asc",
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            duration_days: true,
            features: true,
          },
        }),
        prisma.userSubscription.findFirst({
          where: {
            userId: tokenData.data.id,
            status: "active",
          },
          include: {
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
          orderBy: {
            createddate: "desc",
          },
        }),
      ]);

      return Response.json({
        message: "Subscription data fetched successfully",
        success: true,
        data: {
          plans,
          currentSubscription,
        },
      });
    }
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
 * Handles the POST request to subscribe to a plan.
 * Validates the incoming request data and creates a new user subscription.
 * 
 * @param {Request} req - The incoming request object containing subscription data.
 * @returns {Response} A JSON response indicating the result of the subscription process.
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
      planId: "required",
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
        userId: tokenData.data.id,
        status: "active",
      },
    });

    if (existingSubscription) {
      return Response.json({
        success: false,
        message: "You already have an active subscription",
        data: {
          currentSubscription: existingSubscription,
        },
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    // Create new user subscription
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId: tokenData.data.id,
        planId: body.planId,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        paymentStatus: body.paymentStatus || "pending",
        paymentId: body.paymentId,
        paymentMethod: body.paymentMethod,
        autoRenew: body.autoRenew || false,
      },
      include: {
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
      message: "Subscription created successfully",
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
 * Handles the PUT request to update user subscription (like payment status, auto-renew).
 * 
 * @param {Request} req - The request object containing subscription update data.
 * @returns {Response} A JSON response with the status of the operation and updated subscription details.
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
      subscriptionId: "required",
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

    // Check if subscription exists and belongs to the user
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        id: body.subscriptionId,
        userId: tokenData.data.id,
      },
    });

    if (!existingSubscription) {
      return Response.json({
        success: false,
        message: "Subscription not found or access denied",
        data: {},
      });
    }

    // Prepare update data (only allow certain fields to be updated by user)
    const updateData = {};
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.paymentId) updateData.paymentId = body.paymentId;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.autoRenew !== undefined) updateData.autoRenew = body.autoRenew;

    // Update user subscription
    const updatedSubscription = await prisma.userSubscription.update({
      where: {
        id: body.subscriptionId,
      },
      data: updateData,
      include: {
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
      message: "Subscription updated successfully",
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
 * Handles the DELETE request to cancel user subscription.
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

    // Get the subscription id from the URL parameters
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    // Define validation rules
    const ValidatorRules = {
      subscriptionId: "required",
    };

    // Validate the subscription id parameter
    const { error, status } = await new Promise((resolve) => {
      validator({ subscriptionId }, ValidatorRules, {}, (error, status) => {
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

    // Check if subscription exists and belongs to the user
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: tokenData.data.id,
        status: "active",
      },
    });

    if (!subscription) {
      return Response.json({
        success: false,
        message: "Active subscription not found or access denied",
        data: {},
      });
    }

    // Cancel the subscription (update status to cancelled)
    await prisma.userSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        status: "cancelled",
      },
    });

    return Response.json({
      message: "Subscription cancelled successfully",
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
