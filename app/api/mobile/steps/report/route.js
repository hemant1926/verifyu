import { PrismaClient } from "@prisma/client";
import validator from "@/helper/validate";

const prisma = new PrismaClient();

/**
 * POST /api/steps/report
 * Handles step reporting from Health Connect/HealthKit and awards coins based on thresholds.
 * When a user crosses a step threshold, they earn coins and their step count resets to 0.
 * They must then complete the threshold again to earn more coins.
 * This endpoint is called when user syncs their steps or automatically every X minutes.
 */
export async function POST(req) {
  try {
    const data = await req.json();

    // Define validation rules
    const ValidatorRules = {
      user_id: "required",
      device: "required",
      platform: "required",
      steps: "required|integer|min:0",
      source: "required",
    };

    // Validate form data against predefined rules
    const { error, status } = await new Promise((resolve) => {
      validator(data, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    // Respond with validation errors if any
    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.user_id },
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
      });
    }

    // Get current configuration
    const config = await prisma.stepsConfig.findFirst({
      where: { is_active: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return Response.json({
        success: false,
        message: "Steps configuration not found",
      });
    }

    // Get or create user steps record
    let userSteps = await prisma.userSteps.findUnique({
      where: { userId: data.user_id },
    });

    if (!userSteps) {
      userSteps = await prisma.userSteps.create({
        data: {
          userId: data.user_id,
          total_steps: 0,
          current_steps: 0,
          total_coins: 0,
          last_threshold: 0,
        },
      });
    }

    

    const now = new Date();

    // Get configuration values
    const thresholdSteps = config.threshold_steps ?? 10000;
    const coinsPerThreshold = config.coins_per_threshold ?? 1;
    const maxCoinsPerDay = config.max_coins_per_day ?? 2;
    

    // Calculate new steps since last threshold
    const newSteps = data.steps;
    const currentStepsSinceThreshold = userSteps.current_steps + newSteps;
    
    // Calculate how many thresholds have been crossed
    const thresholdsCrossed = Math.floor(currentStepsSinceThreshold / thresholdSteps);
    
    // Calculate new coins to award (unlimited earning)
    const potentialNewCoins = thresholdsCrossed * coinsPerThreshold;
    const remainingDailyCoins = maxCoinsPerDay - userSteps.total_coins;
    //const newCoinsAwarded = thresholdsCrossed * coinsPerThreshold;
    const newCoinsAwarded = Math.min(potentialNewCoins, remainingDailyCoins);

    // Calculate remaining steps after threshold resets
    const stepsAfterThresholds = currentStepsSinceThreshold % thresholdSteps;
    
    // Update total steps and current steps
    const newTotalSteps = userSteps.total_steps + newSteps;
    const newCurrentSteps = stepsAfterThresholds;

    // Check if we need to reset based on policy
    const lastReset = new Date(userSteps.last_reset_date);
    const shouldReset = config.reset_policy === "daily" && 
      (now.getDate() !== lastReset.getDate() || 
       now.getMonth() !== lastReset.getMonth() || 
       now.getFullYear() !== lastReset.getFullYear());

    if (shouldReset) {
      userSteps = await prisma.userSteps.update({
        where: { userId: data.user_id },
        data: {
          total_steps: 0,
          current_steps: 0,
          total_coins: 0,
          last_threshold: 0,
          last_reset_date: now,
          updatedAt: now,
        },
      });
    }
    

    // Update user steps
    const updatedUserSteps = await prisma.userSteps.update({
      where: { userId: data.user_id },
      data: {
        total_steps: newTotalSteps,
        current_steps: newCurrentSteps,
        total_coins: userSteps.total_coins + newCoinsAwarded,
        last_threshold: userSteps.last_threshold + (thresholdsCrossed * thresholdSteps),
        updatedAt: now,
      },
    });

    // Update or create today's history record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.stepsHistory.upsert({
      where: {
        unique_user_date: {
          userId: data.user_id,
          date: today,
        },
      },
      update: {
        steps: newTotalSteps,
        coins_earned: updatedUserSteps.total_coins,
        updatedAt: now,
      },
      create: {
        userId: data.user_id,
        date: today,
        steps: newTotalSteps,
        coins_earned: updatedUserSteps.total_coins,
      },
    });

    // Calculate next threshold
    // const nextThresholdAt = (Math.floor(currentSteps / thresholdSteps) + 1) * thresholdSteps;
    const nextThresholdAt = thresholdSteps - newCurrentSteps;

    return Response.json({
      success: true,
      data: {
        accepted_steps: newSteps,
        current_steps_since_threshold: newCurrentSteps,
        thresholds_crossed: thresholdsCrossed,
        new_coins_awarded: newCoinsAwarded,
        total_coins: updatedUserSteps.total_coins,
        total_steps_today: newTotalSteps,
        steps_to_next_threshold: nextThresholdAt,
      },
    });
  } catch (error) {
    console.error("Error processing steps report:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to process steps report",
      },
      { status: 500 }
    );
  }
}
