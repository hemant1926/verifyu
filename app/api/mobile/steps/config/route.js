import { PrismaClient } from "@prisma/client";
import validator from "@/helper/validate";
import { verifyToken } from "@/helper/jwtConfig";

const prisma = new PrismaClient();

/**
 * GET /api/steps/config
 * Fetches the latest steps configuration including thresholds, reward rules, and coin values.
 * This endpoint is called when the app starts or when the user opens the StepPage.
 */
export async function GET() {
  try {
    // Get the latest active configuration
    const config = await prisma.stepsConfig.findFirst({
      where: {
        is_active: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // If no config exists, create a default one
    if (!config) {
      const defaultConfig = await prisma.stepsConfig.create({
        data: {
          threshold_steps: 10000,
          coins_per_threshold: 2,
          coin_value_in_rupees: 1.5,
          max_coins_per_day: 6,
          coin_value_in_usd: 1.5,
          reset_policy: "continuous",
          is_active: true,
        },
      });

      return Response.json({
        success: true,
        data: {
          threshold_steps: defaultConfig.threshold_steps,
          coins_per_threshold: defaultConfig.coins_per_threshold,
          coin_value_in_rupees: defaultConfig.coin_value_in_rupees,
          max_coins_per_day: defaultConfig.max_coins_per_day,
          coin_value_in_usd: defaultConfig.coin_value_in_usd,
          reset_policy: defaultConfig.reset_policy,
          last_updated: defaultConfig.updatedAt.toISOString(),
        },
      });
    }

    return Response.json({
      success: true,
      data: {
        threshold_steps: config.threshold_steps,
        coins_per_threshold: config.coins_per_threshold,
        coin_value_in_rupees: config.coin_value_in_rupees,
        last_updated: config.updatedAt.toISOString(),
        max_coins_per_day: config.max_coins_per_day,
        coin_value_in_usd: config.coin_value_in_usd,
        reset_policy: config.reset_policy,
      },
    });
  } catch (error) {
    console.error("Error fetching steps config:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch steps configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/steps/config
 * Updates the steps configuration. Only accessible by authenticated admins.
 * This endpoint allows admins to modify step thresholds, coin rewards, and other settings.
 */
export async function PUT(request) {
  try {
    // Verify admin authentication
    const tokenData = await verifyToken();
    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Check if the authenticated user is an admin
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
        role: 2, // Admin role
      },
    });

    if (!admin) {
      return Response.json({
        success: false,
        message: "Admin not found or insufficient permissions",
      });
    }

    // Parse request body
    const data = await request.json();

    // Define validation rules
    const ValidatorRules = {
      threshold_steps: "required|integer|min:1000|max:50000",
      coins_per_threshold: "required|integer|min:1|max:20",
      coin_value_in_rupees: "required|numeric|min:0.1|max:100",
      max_coins_per_day: "required|integer|min:1|max:20",
      coin_value_in_usd: "required|numeric|min:0.1|max:100",
      reset_policy: "required|string|in:daily,continuous",
    };

    // Validate request data
    const { error, status } = await new Promise((resolve) => {
      validator(data, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "Validation error",
        data: { ...error.errors },
      });
    }

    // Deactivate current active configuration
    await prisma.stepsConfig.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    // Create new configuration
    const newConfig = await prisma.stepsConfig.create({
      data: {
        threshold_steps: data.threshold_steps,
        coins_per_threshold: data.coins_per_threshold,
        coin_value_in_rupees: data.coin_value_in_rupees,
        max_coins_per_day: data.max_coins_per_day,
        coin_value_in_usd: data.coin_value_in_usd,
        reset_policy: data.reset_policy,
        is_active: true,
      },
    });

    return Response.json({
      success: true,
      message: "Steps configuration updated successfully",
      data: {
        id: newConfig.id,
        threshold_steps: newConfig.threshold_steps,
        coins_per_threshold: newConfig.coins_per_threshold,
        coin_value_in_rupees: newConfig.coin_value_in_rupees,
        max_coins_per_day: newConfig.max_coins_per_day,
        coin_value_in_usd: newConfig.coin_value_in_usd,
        reset_policy: newConfig.reset_policy,
        last_updated: newConfig.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating steps config:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update steps configuration",
      },
      { status: 500 }
    );
  }
}
