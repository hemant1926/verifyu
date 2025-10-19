import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";
import { createRazorpayOrder, convertToPaise } from "@/helper/razorpayConfig";

const prisma = new PrismaClient();

/**
 * Handles the POST request to create a Razorpay order for subscription payment.
 * Validates the user, plan, and creates a Razorpay order with coin redemption support.
 * 
 * @param {Request} req - The incoming request object containing payment data.
 * @returns {Response} A JSON response with Razorpay order details or an error message.
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

    // If final price is 0, no payment needed (fully covered by coins)
    if (finalPrice === 0) {
      return Response.json({
        success: false,
        message: "No payment required - fully covered by coins",
        data: {
          coins_used: coinsToUse,
          coin_discount: coinDiscount,
          final_price: finalPrice,
          payment_method: "coins",
        },
      });
    }

    // Create Razorpay order
    const orderResult = await createRazorpayOrder({
      amount: convertToPaise(finalPrice),
      currency: plan.currency || "INR",
      receipt: `sub_${tokenData.data.id}_${Date.now()}`,
      notes: {
        userId: tokenData.data.id,
        planId: plan.id,
        planName: plan.name,
        originalPrice: plan.price,
        coinDiscount: coinDiscount,
        coinsUsed: coinsToUse,
        finalPrice: finalPrice,
        paymentType: "subscription",
      },
    });

    if (!orderResult.success) {
      return Response.json({
        success: false,
        message: "Failed to create payment order",
        data: {
          error: orderResult.error,
        },
      });
    }

    // Store payment intent in database (optional - for tracking)
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId: tokenData.data.id,
        planId: plan.id,
        razorpayOrderId: orderResult.order.id,
        amount: finalPrice,
        currency: plan.currency || "INR",
        status: "pending",
        coinDiscount: coinDiscount,
        coinsUsed: coinsToUse,
        metadata: {
          originalPrice: plan.price,
          planName: plan.name,
          paymentType: "subscription",
        },
      },
    });

    return Response.json({
      message: "Payment order created successfully",
      success: true,
      data: {
        order: orderResult.order,
        paymentIntent: {
          id: paymentIntent.id,
          amount: finalPrice,
          currency: plan.currency || "INR",
          coinDiscount: coinDiscount,
          coinsUsed: coinsToUse,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          originalPrice: plan.price,
          finalPrice: finalPrice,
          currency: plan.currency,
          duration_days: plan.duration_days,
          features: plan.features,
        },
        user: {
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
        },
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
