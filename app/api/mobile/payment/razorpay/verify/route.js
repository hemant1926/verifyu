import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";
import { verifyPaymentSignature, fetchPaymentDetails } from "@/helper/razorpayConfig";

const prisma = new PrismaClient();

/**
 * Handles the POST request to verify Razorpay payment and create subscription.
 * Verifies payment signature, updates payment status, and creates user subscription.
 * 
 * @param {Request} req - The incoming request object containing payment verification data.
 * @returns {Response} A JSON response with subscription details or an error message.
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
      razorpay_order_id: "required",
      razorpay_payment_id: "required",
      razorpay_signature: "required",
      payment_intent_id: "required",
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

    // Verify payment signature
    const isSignatureValid = verifyPaymentSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    );

    if (!isSignatureValid) {
      return Response.json({
        success: false,
        message: "Invalid payment signature",
        data: {},
      });
    }

    // Fetch payment details from Razorpay
    const paymentResult = await fetchPaymentDetails(body.razorpay_payment_id);
    
    if (!paymentResult.success) {
      return Response.json({
        success: false,
        message: "Failed to fetch payment details",
        data: {
          error: paymentResult.error,
        },
      });
    }

    const payment = paymentResult.payment;

    // Check if payment is successful
    if (payment.status !== "captured") {
      return Response.json({
        success: false,
        message: "Payment not successful",
        data: {
          payment_status: payment.status,
        },
      });
    }

    // Find the payment intent
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: {
        id: body.payment_intent_id,
        userId: tokenData.data.id,
        status: "pending",
      },
      include: {
        plan: true,
      },
    });

    if (!paymentIntent) {
      return Response.json({
        success: false,
        message: "Payment intent not found or already processed",
        data: {},
      });
    }

    // Verify payment amount matches
    const expectedAmount = paymentIntent.amount * 100; // Convert to paise
    if (payment.amount !== expectedAmount) {
      return Response.json({
        success: false,
        message: "Payment amount mismatch",
        data: {
          expected: expectedAmount,
          received: payment.amount,
        },
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
    endDate.setDate(startDate.getDate() + paymentIntent.plan.duration_days);

    // Create user subscription
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId: tokenData.data.id,
        planId: paymentIntent.planId,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        paymentStatus: "paid",
        paymentId: body.razorpay_payment_id,
        paymentMethod: "razorpay",
        autoRenew: false,
        coins_used: paymentIntent.coinsUsed || 0,
        coin_discount: paymentIntent.coinDiscount || 0,
        final_price: paymentIntent.amount,
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

    // Update payment intent status
    await prisma.paymentIntent.update({
      where: {
        id: paymentIntent.id,
      },
      data: {
        status: "completed",
        razorpayPaymentId: body.razorpay_payment_id,
        completedAt: new Date(),
      },
    });

    // Update user's coin balance if coins were used
    if (paymentIntent.coinsUsed > 0) {
      await prisma.userSteps.update({
        where: {
          userId: tokenData.data.id,
        },
        data: {
          redeemed_coins: {
            increment: paymentIntent.coinsUsed,
          },
          available_coins: {
            decrement: paymentIntent.coinsUsed,
          },
          last_redeem_at: new Date(),
        },
      });
    }

    return Response.json({
      message: "Payment verified and subscription created successfully",
      success: true,
      data: {
        subscription: newSubscription,
        payment: {
          id: body.razorpay_payment_id,
          order_id: body.razorpay_order_id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "captured",
          method: payment.method,
          created_at: payment.created_at,
        },
        coins_used: paymentIntent.coinsUsed || 0,
        coin_discount: paymentIntent.coinDiscount || 0,
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
