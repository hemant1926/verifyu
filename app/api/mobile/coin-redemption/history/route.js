import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch user's coin redemption history.
 * Verifies the JWT token from the request headers and fetches the redemption history.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Response} A JSON response containing the redemption history or an error message.
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
    const action = searchParams.get("action");
    const redemptionId = searchParams.get("redemptionId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build where clause
    const whereClause = {
      userId: tokenData.data.id,
    };

    if (action) {
      whereClause.action = action;
    }

    if (redemptionId) {
      whereClause.redemptionId = redemptionId;
    }

    // Handle date range filtering
    if (fromDate || toDate) {
      whereClause.createddate = {};
      if (fromDate) {
        whereClause.createddate.gte = new Date(fromDate);
      }
      if (toDate) {
        whereClause.createddate.lte = new Date(toDate);
      }
    }

    // Fetch redemption history with pagination
    const history = await prisma.coinRedemptionHistory.findMany({
      where: whereClause,
      orderBy: {
        createddate: "desc",
      },
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      take: limit ? parseInt(limit) : 10,
      include: {
        redemption: {
          select: {
            id: true,
            status: true,
            request_type: true,
            payment_method: true,
            createddate: true,
          },
        },
      },
    });

    const total = await prisma.coinRedemptionHistory.count({
      where: whereClause,
    });

    // Calculate statistics
    const stats = await prisma.coinRedemptionHistory.aggregate({
      where: {
        userId: tokenData.data.id,
      },
      _count: {
        id: true,
      },
      _sum: {
        coins_amount: true,
        amount_value: true,
      },
    });

    // Get action-wise statistics
    const actionStats = await prisma.coinRedemptionHistory.groupBy({
      by: ['action'],
      where: {
        userId: tokenData.data.id,
      },
      _count: {
        id: true,
      },
      _sum: {
        coins_amount: true,
        amount_value: true,
      },
    });

    return Response.json({
      message: "Coin redemption history fetched successfully",
      success: true,
      data: {
        history,
        statistics: {
          totalEntries: stats._count.id,
          totalCoins: stats._sum.coins_amount || 0,
          totalAmount: stats._sum.amount_value || 0,
          actionBreakdown: actionStats.map(stat => ({
            action: stat.action,
            count: stat._count.id,
            coins: stat._sum.coins_amount || 0,
            amount: stat._sum.amount_value || 0,
          })),
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
