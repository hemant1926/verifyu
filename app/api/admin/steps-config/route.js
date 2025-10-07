import { PrismaClient } from "@prisma/client";
import validator from "@/helper/validate";
import { verifyToken } from "@/helper/jwtConfig";

const prisma = new PrismaClient();

/**
 * GET /api/admin/steps-config
 * Fetches all steps configurations including inactive ones for admin management.
 * Only accessible by authenticated admins.
 */
export async function GET() {
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

    // Get all configurations ordered by creation date
    const configs = await prisma.stepsConfig.findMany({
      orderBy: {
        createddate: 'desc',
      },
    });

    return Response.json({
      success: true,
      data: configs.map(config => ({
        id: config.id,
        threshold_steps: config.threshold_steps,
        coins_per_threshold: config.coins_per_threshold,
        coin_value_in_rupees: config.coin_value_in_rupees,
        max_coins_per_day: config.max_coins_per_day,
        coin_value_in_usd: config.coin_value_in_usd,
        reset_policy: config.reset_policy,
        is_active: config.is_active,
        created_date: config.createddate.toISOString(),
        last_updated: config.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching admin steps config:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch steps configurations",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/steps-config
 * Creates a new steps configuration and optionally activates it.
 * Only accessible by authenticated admins.
 */
export async function POST(request) {
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
      is_active: "boolean",
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

    // If this config is being set as active, deactivate all others
    if (data.is_active) {
      await prisma.stepsConfig.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });
    }

    // Create new configuration
    const newConfig = await prisma.stepsConfig.create({
      data: {
        threshold_steps: data.threshold_steps,
        coins_per_threshold: data.coins_per_threshold,
        coin_value_in_rupees: data.coin_value_in_rupees,
        max_coins_per_day: data.max_coins_per_day,
        coin_value_in_usd: data.coin_value_in_usd,
        reset_policy: data.reset_policy,
        is_active: data.is_active || false,
      },
    });

    return Response.json({
      success: true,
      message: "Steps configuration created successfully",
      data: {
        id: newConfig.id,
        threshold_steps: newConfig.threshold_steps,
        coins_per_threshold: newConfig.coins_per_threshold,
        coin_value_in_rupees: newConfig.coin_value_in_rupees,
        max_coins_per_day: newConfig.max_coins_per_day,
        coin_value_in_usd: newConfig.coin_value_in_usd,
        reset_policy: newConfig.reset_policy,
        is_active: newConfig.is_active,
        created_date: newConfig.createddate.toISOString(),
        last_updated: newConfig.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating steps config:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to create steps configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/steps-config
 * Updates an existing steps configuration.
 * Only accessible by authenticated admins.
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
      id: "required",
      threshold_steps: "required|integer|min:1000|max:50000",
      coins_per_threshold: "required|integer|min:1|max:20",
      coin_value_in_rupees: "required|numeric|min:0.1|max:100",
      max_coins_per_day: "required|integer|min:1|max:20",
      coin_value_in_usd: "required|numeric|min:0.1|max:100",
      reset_policy: "required|string|in:daily,continuous",
      is_active: "boolean",
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

    // Check if configuration exists
    const existingConfig = await prisma.stepsConfig.findUnique({
      where: { id: data.id },
    });

    if (!existingConfig) {
      return Response.json({
        success: false,
        message: "Configuration not found",
      });
    }

    // If this config is being set as active, deactivate all others
    if (data.is_active) {
      await prisma.stepsConfig.updateMany({
        where: { 
          is_active: true,
          id: { not: data.id }
        },
        data: { is_active: false },
      });
    }

    // Update configuration
    const updatedConfig = await prisma.stepsConfig.update({
      where: { id: data.id },
      data: {
        threshold_steps: data.threshold_steps,
        coins_per_threshold: data.coins_per_threshold,
        coin_value_in_rupees: data.coin_value_in_rupees,
        max_coins_per_day: data.max_coins_per_day,
        coin_value_in_usd: data.coin_value_in_usd,
        reset_policy: data.reset_policy,
        is_active: data.is_active,
        updatedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      message: "Steps configuration updated successfully",
      data: {
        id: updatedConfig.id,
        threshold_steps: updatedConfig.threshold_steps,
        coins_per_threshold: updatedConfig.coins_per_threshold,
        coin_value_in_rupees: updatedConfig.coin_value_in_rupees,
        max_coins_per_day: updatedConfig.max_coins_per_day,
        coin_value_in_usd: updatedConfig.coin_value_in_usd,
        reset_policy: updatedConfig.reset_policy,
        is_active: updatedConfig.is_active,
        created_date: updatedConfig.createddate.toISOString(),
        last_updated: updatedConfig.updatedAt.toISOString(),
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

/**
 * DELETE /api/admin/steps-config
 * Deletes a steps configuration (only if it's not active).
 * Only accessible by authenticated admins.
 */
export async function DELETE(request) {
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

    // Get configuration ID from query parameters
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return Response.json({
        success: false,
        message: "Configuration ID is required",
      });
    }

    // Check if configuration exists and is not active
    const config = await prisma.stepsConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return Response.json({
        success: false,
        message: "Configuration not found",
      });
    }

    if (config.is_active) {
      return Response.json({
        success: false,
        message: "Cannot delete active configuration. Please activate another configuration first.",
      });
    }

    // Delete configuration
    await prisma.stepsConfig.delete({
      where: { id: configId },
    });

    return Response.json({
      success: true,
      message: "Steps configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting steps config:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to delete steps configuration",
      },
      { status: 500 }
    );
  }
}
