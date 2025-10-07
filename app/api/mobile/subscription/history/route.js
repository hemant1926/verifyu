import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch user's subscription history.
 * Verifies the JWT token from the request headers and fetches the user's subscription history.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the subscription history or an error message.
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
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");

    // Build where clause
    const whereClause = {
      userId: tokenData.data.id,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch user subscription history with pagination
    const subscriptions = await prisma.userSubscription.findMany({
      where: whereClause,
      orderBy: {
        createddate: "desc",
      },
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      take: limit ? parseInt(limit) : 10,
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

    const total = await prisma.userSubscription.count({
      where: whereClause,
    });

    // Calculate subscription statistics
    const stats = await prisma.userSubscription.aggregate({
      where: {
        userId: tokenData.data.id,
      },
      _count: {
        id: true,
      },
      _sum: {
        // Note: We can't sum plan.price directly, so we'll calculate this separately
      },
    });

    // Get total amount spent (this is a simplified calculation)
    const totalSpent = await prisma.userSubscription.findMany({
      where: {
        userId: tokenData.data.id,
        paymentStatus: "paid",
      },
      include: {
        plan: {
          select: {
            price: true,
          },
        },
      },
    });

    const totalAmountSpent = totalSpent.reduce((sum, sub) => sum + sub.plan.price, 0);

    return Response.json({
      message: "Subscription history fetched successfully",
      success: true,
      data: {
        subscriptions,
        statistics: {
          totalSubscriptions: stats._count.id,
          totalAmountSpent: totalAmountSpent,
          activeSubscriptions: subscriptions.filter(sub => sub.status === "active").length,
        },
      },
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
