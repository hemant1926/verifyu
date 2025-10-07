import { PrismaClient } from "@prisma/client";
import validator from "@/helper/validate";

const prisma = new PrismaClient();

/**
 * GET /api/steps/history
 * Fetches the user's step history for the specified number of days.
 * This endpoint is used to populate bar charts and 7-day history views.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const days = parseInt(searchParams.get("days")) || 7;

    // Define validation rules
    const ValidatorRules = {
      user_id: "required",
      days: "integer|min:1|max:365",
    };

    // Validate query parameters
    const { error, status } = await new Promise((resolve) => {
      validator(
        { user_id, days },
        ValidatorRules,
        {},
        (error, status) => {
          resolve({ error, status });
        }
      );
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0); // Start of the day

    // Fetch history records for the specified date range
    const historyRecords = await prisma.stepsHistory.findMany({
      where: {
        userId: user_id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Create a map of existing records for quick lookup
    const historyMap = new Map();
    historyRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      historyMap.set(dateKey, {
        steps: record.steps,
        coins: record.coins_earned,
      });
    });

    // Generate complete history array for the requested days
    const history = [];
    let totalSteps = 0;
    let totalCoins = 0;

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      const record = historyMap.get(dateKey) || { steps: 0, coins: 0 };
      
      history.push({
        date: dateKey,
        steps: record.steps,
        coins: record.coins,
      });
      
      totalSteps += record.steps;
      totalCoins += record.coins;
    }

    return Response.json({
      success: true,
      data: {
        history,
        total_coins: totalCoins,
        total_steps: totalSteps,
      },
    });
  } catch (error) {
    console.error("Error fetching steps history:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch steps history",
      },
      { status: 500 }
    );
  }
}
