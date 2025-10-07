
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET handler for fetching the count of users and admins
 * 
 * This function makes use of the Prisma client to interact with the database
 * and fetch the counts of users and admins in the system.
 * 
 * @returns {Response} A JSON response containing the counts of users and admins
 */
export const GET = async () => {
    try {
        // Count the number of users in the system
        const userCounts = await prisma.user.count();

        // Count the number of admins with a role of 1
        const EmployCounts = await prisma.admin.count(
            {
                where: {
                    role: 1
                }
            }
        );

        return Response.json({
            success: true,
            message: "Query submitted successfully",
            data: {
                emp: EmployCounts,
                user: userCounts
            },
        })

    } catch (error) {
        console.error("error:", error);
        return Response.json({
            message: "Something went wrong",
            data: { ...error },
            success: false,
        });
    }
}
