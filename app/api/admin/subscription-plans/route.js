import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch subscription plans.
 * Verifies the JWT token from the request headers and fetches the subscription plans.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the subscription plans or an error message.
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
    const active = searchParams.get("active");

    // Build where clause
    const whereClause = {};
    if (active !== null && active !== undefined) {
      whereClause.is_active = active === "true";
    }

    // Fetch subscription plans with pagination
    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: {
        createddate: "desc",
      },
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      take: limit ? parseInt(limit) : 10,
      include: {
        _count: {
          select: {
            userSubscriptions: true,
          },
        },
      },
    });

    const total = await prisma.subscriptionPlan.count({
      where: whereClause,
    });

    return Response.json({
      message: "Subscription plans fetched successfully",
      success: true,
      data: plans,
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
 * Handles the POST request to create a new subscription plan.
 * Validates the incoming request data and creates a new subscription plan.
 * 
 * @param {Request} req - The incoming request object containing plan data.
 * @returns {Response} A JSON response indicating the result of the plan creation process.
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
      name: "required",
      description: "required",
      price: "required|numeric",
      duration_days: "required|numeric",
      features: "required",
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

    // Create new subscription plan
    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        currency: body.currency || "USD",
        duration_days: parseInt(body.duration_days),
        features: Array.isArray(body.features) ? body.features : [],
        is_active: body.is_active !== undefined ? body.is_active : true,
      },
    });

    return Response.json({
      message: "Subscription plan created successfully",
      success: true,
      data: newPlan,
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
 * Handles the PUT request to update a subscription plan.
 * 
 * @param {Request} req - The request object containing plan data.
 * @returns {Response} A JSON response with the status of the operation and updated plan details.
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

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!existingPlan) {
      return Response.json({
        success: false,
        message: "Subscription plan not found",
        data: {},
      });
    }

    // Prepare update data
    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.price) updateData.price = parseFloat(body.price);
    if (body.currency) updateData.currency = body.currency;
    if (body.duration_days) updateData.duration_days = parseInt(body.duration_days);
    if (body.features) updateData.features = Array.isArray(body.features) ? body.features : [];
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Update subscription plan
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: {
        id: body.id,
      },
      data: updateData,
    });

    return Response.json({
      message: "Subscription plan updated successfully",
      success: true,
      data: updatedPlan,
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
 * Handles the DELETE request to delete a subscription plan.
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

    // Get the plan id from the URL parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Define validation rules
    const ValidatorRules = {
      id: "required",
    };

    // Validate the plan id parameter
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

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.userSubscription.count({
      where: {
        planId: id,
        status: "active",
      },
    });

    if (activeSubscriptions > 0) {
      return Response.json({
        success: false,
        message: "Cannot delete plan with active subscriptions. Deactivate instead.",
        data: {},
      });
    }

    // Delete the subscription plan
    await prisma.subscriptionPlan.delete({
      where: {
        id: id,
      },
    });

    return Response.json({
      message: "Subscription plan deleted successfully",
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
