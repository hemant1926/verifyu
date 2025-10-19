import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to calculate coin redemption values for subscription plans.
 * Verifies the JWT token and calculates how many coins can be used for each plan.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing coin redemption calculations or an error message.
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const currency = searchParams.get("currency");

    let plans = [];

    if (planId) {
      // Get specific plan
      const plan = await prisma.subscriptionPlan.findUnique({
        where: {
          id: planId,
          is_active: true,
        },
      });

      if (plan) {
        plans = [plan];
      }
    } else {
      // Get all active plans
      plans = await prisma.subscriptionPlan.findMany({
        where: {
          is_active: true,
          currency: currency || "USD",
        },
        orderBy: {
          price: "asc",
        },
      });
    }

    // Calculate coin redemption for each plan
    const plansWithCoinInfo = plans.map(plan => {
      const calculations = {
        original_price: plan.price,
        available_coins: userSteps.available_coins,
        can_use_coins: false,
        max_coins_allowed: 0,
        max_coin_discount: 0,
        final_price_with_max_coins: plan.price,
        coin_value_ratio: plan.coin_value_ratio || 0,
        max_redemption_percent: plan.max_coin_redemption_percent || 0,
        coins_required: plan.coins_required || 0,
      };

      // Check if plan supports coin redemption
      if (plan.coin_value_ratio && plan.coin_value_ratio > 0 && plan.max_coin_redemption_percent > 0) {
        calculations.can_use_coins = true;
        
        // Calculate maximum coins allowed based on redemption percentage
        const maxDiscountAmount = (plan.price * plan.max_coin_redemption_percent) / 100;
        calculations.max_coins_allowed = Math.floor(maxDiscountAmount / plan.coin_value_ratio);
        calculations.max_coin_discount = Math.min(
          calculations.max_coins_allowed * plan.coin_value_ratio,
          maxDiscountAmount
        );
        calculations.final_price_with_max_coins = Math.max(0, plan.price - calculations.max_coin_discount);

        // Check if user has enough coins for minimum requirements
        if (plan.coins_required && plan.coins_required > 0) {
          calculations.meets_minimum_requirement = userSteps.available_coins >= plan.coins_required;
        } else {
          calculations.meets_minimum_requirement = true;
        }
      }

      return {
        ...plan,
        coin_calculations: calculations,
      };
    });

    return Response.json({
      message: "Coin redemption calculations completed successfully",
      success: true,
      data: {
        user_coin_balance: {
          total_coins: userSteps.total_coins,
          available_coins: userSteps.available_coins,
          redeemed_coins: userSteps.redeemed_coins,
        },
        plans: plansWithCoinInfo,
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
 * Handles the POST request to calculate specific coin redemption scenarios.
 * Allows users to test different coin amounts for a specific plan.
 * 
 * @param {Request} req - The incoming request object containing calculation parameters.
 * @returns {Response} A JSON response with detailed coin redemption calculations.
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

    // Parse request body
    const body = await req.json();

    // Validation rules
    const ValidatorRules = {
      planId: "required",
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

    // Get the plan
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

    const requestedCoins = body.coins_to_use || 0;
    const calculations = {
      plan_id: plan.id,
      plan_name: plan.name,
      original_price: plan.price,
      currency: plan.currency,
      requested_coins: requestedCoins,
      available_coins: userSteps.available_coins,
      can_use_coins: false,
      coins_that_can_be_used: 0,
      coin_discount: 0,
      final_price: plan.price,
      payment_method: "card",
      meets_requirements: true,
      errors: [],
    };

    // Check if plan supports coin redemption
    if (!plan.coin_value_ratio || plan.coin_value_ratio <= 0) {
      calculations.errors.push("This plan does not support coin redemption");
      return Response.json({
        message: "Coin redemption calculation completed",
        success: true,
        data: calculations,
      });
    }

    if (plan.max_coin_redemption_percent <= 0) {
      calculations.errors.push("This plan does not allow coin redemption");
      return Response.json({
        message: "Coin redemption calculation completed",
        success: true,
        data: calculations,
      });
    }

    calculations.can_use_coins = true;

    // Calculate maximum coins allowed
    const maxDiscountAmount = (plan.price * plan.max_coin_redemption_percent) / 100;
    const maxCoinsAllowed = Math.floor(maxDiscountAmount / plan.coin_value_ratio);

    // Determine how many coins can actually be used
    calculations.coins_that_can_be_used = Math.min(
      requestedCoins,
      userSteps.available_coins,
      maxCoinsAllowed
    );

    // Calculate discount and final price
    calculations.coin_discount = calculations.coins_that_can_be_used * plan.coin_value_ratio;
    calculations.final_price = Math.max(0, plan.price - calculations.coin_discount);

    // Determine payment method
    if (calculations.final_price === 0) {
      calculations.payment_method = "coins";
    } else if (calculations.coins_that_can_be_used > 0) {
      calculations.payment_method = "coins_and_card";
    }

    // Check minimum coin requirements
    if (plan.coins_required && plan.coins_required > 0) {
      calculations.meets_requirements = calculations.coins_that_can_be_used >= plan.coins_required;
      if (!calculations.meets_requirements) {
        calculations.errors.push(`This plan requires at least ${plan.coins_required} coins`);
      }
    }

    // Add validation errors
    if (requestedCoins > userSteps.available_coins) {
      calculations.errors.push("Insufficient coins available");
    }

    if (requestedCoins > maxCoinsAllowed) {
      calculations.errors.push(`Maximum ${maxCoinsAllowed} coins allowed for this plan`);
    }

    return Response.json({
      message: "Coin redemption calculation completed",
      success: true,
      data: calculations,
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
