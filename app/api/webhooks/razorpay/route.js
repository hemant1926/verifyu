import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Handles Razorpay webhook events.
 * Processes payment events and updates subscription status accordingly.
 * 
 * @param {Request} req - The incoming webhook request.
 * @returns {Response} A JSON response indicating webhook processing status.
 */
export async function POST(req) {
  try {
    // Get the webhook signature from headers
    const razorpaySignature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!razorpaySignature || !webhookSecret) {
      return Response.json({
        success: false,
        message: "Missing webhook signature or secret",
      }, { status: 400 });
    }

    // Get the raw body
    const body = await req.text();

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (razorpaySignature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return Response.json({
        success: false,
        message: "Invalid webhook signature",
      }, { status: 401 });
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      case "payment.authorized":
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return Response.json({
      success: true,
      message: "Webhook processed successfully",
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * Handles payment captured event
 * @param {Object} payment - Payment entity from Razorpay
 */
async function handlePaymentCaptured(payment) {
  try {
    console.log("Payment captured:", payment.id);

    // Find the payment intent
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        razorpayPaymentId: payment.id,
        status: "pending",
      },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!paymentIntent) {
      console.log("Payment intent not found for payment:", payment.id);
      return;
    }

    // Update payment intent status
    await prisma.paymentIntent.update({
      where: {
        id: paymentIntent.id,
      },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Check if user already has an active subscription
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: paymentIntent.userId,
        status: "active",
      },
    });

    if (existingSubscription) {
      console.log("User already has active subscription:", paymentIntent.userId);
      return;
    }

    // Create user subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + paymentIntent.plan.duration_days);

    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId: paymentIntent.userId,
        planId: paymentIntent.planId,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        paymentStatus: "paid",
        paymentId: payment.id,
        paymentMethod: "razorpay",
        autoRenew: false,
        coins_used: paymentIntent.coinsUsed || 0,
        coin_discount: paymentIntent.coinDiscount || 0,
        final_price: paymentIntent.amount,
      },
    });

    // Update user's coin balance if coins were used
    if (paymentIntent.coinsUsed > 0) {
      await prisma.userSteps.update({
        where: {
          userId: paymentIntent.userId,
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

    console.log("Subscription created successfully:", newSubscription.id);

  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

/**
 * Handles payment failed event
 * @param {Object} payment - Payment entity from Razorpay
 */
async function handlePaymentFailed(payment) {
  try {
    console.log("Payment failed:", payment.id);

    // Find the payment intent
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        razorpayPaymentId: payment.id,
        status: "pending",
      },
    });

    if (paymentIntent) {
      // Update payment intent status
      await prisma.paymentIntent.update({
        where: {
          id: paymentIntent.id,
        },
        data: {
          status: "failed",
        },
      });

      console.log("Payment intent updated to failed:", paymentIntent.id);
    }

  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

/**
 * Handles order paid event
 * @param {Object} order - Order entity from Razorpay
 */
async function handleOrderPaid(order) {
  try {
    console.log("Order paid:", order.id);

    // Find the payment intent
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        razorpayOrderId: order.id,
        status: "pending",
      },
    });

    if (paymentIntent) {
      // Update payment intent status
      await prisma.paymentIntent.update({
        where: {
          id: paymentIntent.id,
        },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      console.log("Payment intent updated to completed:", paymentIntent.id);
    }

  } catch (error) {
    console.error("Error handling order paid:", error);
  }
}

/**
 * Handles payment authorized event
 * @param {Object} payment - Payment entity from Razorpay
 */
async function handlePaymentAuthorized(payment) {
  try {
    console.log("Payment authorized:", payment.id);

    // Find the payment intent
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        razorpayPaymentId: payment.id,
        status: "pending",
      },
    });

    if (paymentIntent) {
      // Update payment intent status
      await prisma.paymentIntent.update({
        where: {
          id: paymentIntent.id,
        },
        data: {
          status: "authorized",
        },
      });

      console.log("Payment intent updated to authorized:", paymentIntent.id);
    }

  } catch (error) {
    console.error("Error handling payment authorized:", error);
  }
}
