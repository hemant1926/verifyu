import { verifyToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch coin redemption history (admin view).
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
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const redemptionId = searchParams.get("redemptionId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const search = searchParams.get("search");

    // Build where clause
    const whereClause = {};

    if (action) {
      whereClause.action = action;
    }

    if (userId) {
      whereClause.userId = userId;
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

    // Handle search functionality
    if (search && search.trim() !== "") {
      whereClause.OR = [
        {
          user: {
            firstname: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            lastname: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            mobileno: { contains: search, mode: "insensitive" },
          },
        },
        {
          notes: { contains: search, mode: "insensitive" },
        },
      ];
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
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
          },
        },
        redemption: {
          select: {
            id: true,
            status: true,
            request_type: true,
            payment_method: true,
            createddate: true,
            admin_notes: true,
          },
        },
      },
    });

    const total = await prisma.coinRedemptionHistory.count({
      where: whereClause,
    });

    // Calculate statistics
    const stats = await prisma.coinRedemptionHistory.aggregate({
      where: whereClause,
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
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        coins_amount: true,
        amount_value: true,
      },
    });

    // Get user-wise statistics (top users by redemption activity)
    const userStats = await prisma.coinRedemptionHistory.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        coins_amount: true,
        amount_value: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top users
    const topUsers = await Promise.all(
      userStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            mobileno: true,
          },
        });
        return {
          user,
          count: stat._count.id,
          coins: stat._sum.coins_amount || 0,
          amount: stat._sum.amount_value || 0,
        };
      })
    );

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
          topUsers: topUsers,
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
