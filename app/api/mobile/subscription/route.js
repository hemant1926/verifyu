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
    const currency = searchParams.get("currency");

    if (type === "plans") {
      // Fetch available subscription plans
      const plans = await prisma.subscriptionPlan.findMany({
        where: {
          is_active: true,
          currency: currency || "INR",
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
          coins_required: true,
          max_coin_redemption_percent: true,
          coin_value_ratio: true,
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
            coins_required: true,
            max_coin_redemption_percent: true,
            coin_value_ratio: true,
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
                coins_required: true,
                max_coin_redemption_percent: true,
                coin_value_ratio: true,
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
      use_coins: "boolean",
      coins_to_use: "integer|min:0",
      payment_method: "string",
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

    // Get user's coin balance
    const userSteps = await prisma.userSteps.findUnique({
      where: {
        userId: tokenData.data.id,
      },
    });

    if (!userSteps) {
      return Response.json({
        success: false,
        message: "User steps data not found",
        data: {},
      });
    }

    // Calculate coin redemption if requested
    let coinsToUse = 0;
    let coinDiscount = 0;
    let finalPrice = plan.price;
    let paymentMethod = body.paymentMethod || "card";

    if (body.use_coins && plan.coin_value_ratio && plan.max_coin_redemption_percent > 0) {
      const maxCoinsAllowed = Math.floor((plan.price * plan.max_coin_redemption_percent / 100) / plan.coin_value_ratio);
      const requestedCoins = body.coins_to_use || 0;
      
      // Use the minimum of requested coins, available coins, and max allowed coins
      coinsToUse = Math.min(requestedCoins, userSteps.available_coins, maxCoinsAllowed);
      
      if (coinsToUse > 0) {
        coinDiscount = coinsToUse * plan.coin_value_ratio;
        finalPrice = Math.max(0, plan.price - coinDiscount);
      }
    }

    // If final price is 0, payment is fully covered by coins
    if (finalPrice === 0) {
      paymentMethod = "coins";
    } else {
      // Use the specified payment method for non-zero amounts
      paymentMethod = body.payment_method || "razorpay";
    }

    // Validate coin requirements if plan has specific coin requirements
    if (plan.coins_required && plan.coins_required > 0) {
      if (!body.use_coins || coinsToUse < plan.coins_required) {
        return Response.json({
          success: false,
          message: `This plan requires at least ${plan.coins_required} coins for redemption`,
          data: {
            required_coins: plan.coins_required,
            available_coins: userSteps.available_coins,
          },
        });
      }
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

    // If payment method is Razorpay and final price > 0, redirect to payment creation
    if (paymentMethod === "razorpay" && finalPrice > 0) {
      return Response.json({
        success: false,
        message: "Please use the Razorpay payment creation endpoint",
        data: {
          redirect_to: "/api/mobile/payment/razorpay/create-order",
          payment_method: "razorpay",
          amount: finalPrice,
          currency: plan.currency || "INR",
          plan_id: plan.id,
          use_coins: body.use_coins,
          coins_to_use: coinsToUse,
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
        paymentMethod: paymentMethod,
        autoRenew: body.autoRenew || false,
        // Coin redemption fields
        coins_used: coinsToUse,
        coin_discount: coinDiscount,
        final_price: finalPrice,
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
            coins_required: true,
            max_coin_redemption_percent: true,
            coin_value_ratio: true,
          },
        },
      },
    });

    // Update user's coin balance if coins were used
    if (coinsToUse > 0) {
      await prisma.userSteps.update({
        where: {
          userId: tokenData.data.id,
        },
        data: {
          redeemed_coins: {
            increment: coinsToUse,
          },
          available_coins: {
            decrement: coinsToUse,
          },
          last_redeem_at: new Date(),
        },
      });
    }

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
            coins_required: true,
            max_coin_redemption_percent: true,
            coin_value_ratio: true,
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
