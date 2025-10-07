import { verifyToken } from "@/helper/jwtConfig";
import { encrypt } from "@/helper/security";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * Handles the GET request to fetch the admins.
 * Verifies the JWT token from the request headers and fetches the admins.
 * @returns {Response} A JSON response containing the admins details or an error message.
 */
export async function GET(request) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();

    if (!tokenData.success) {
      // If the token verification fails, return an error message
      return Response.json(tokenData);
    }

    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Get the userId parameter
    const descending = searchParams.get("descending"); // Get the descending parameter
    const page = searchParams.get("page"); // Get the page parameter
    const search = searchParams.get("search"); // Get the search parameter

    if (userId) {
      // If userId is provided, fetch the admin details from the database
      const admin = await prisma.admin.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          userName: true,
          name: true,
          mobileno: true,
          email: true,
          role: true,
          status: true,
          createddate: true,
          updatedAt: true,
        },
      });
      return Response.json({
        data: admin,
        message: "Successfully found admin",
        success: true,
      });
    }

    if (search != "") {
      // If search is provided, fetch the admins based on the search criteria
      const admins = await prisma.admin.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { userName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { mobileno: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: descending == "true" ? "desc" : "asc", // Sort the results based on the descending parameter
        },
      });

      // Transform the fetched admins
      const transformedUsers = await Promise.all(
        admins.map(async (element, index) => {
          return {
            index: index + 1,
            name: `${element.firstname} ${element.lastname}`,
            ...element,
            status: element.status,
          };
        })
      );
      return Response.json({
        message: "Users fetched successfully",
        success: true,
        data: transformedUsers,
        totalResults: transformedUsers.length,
      });
    }

    // Fetch the admins based on the role
    const admins = await prisma.admin.findMany({
      where: {
        role: 1,
      },
      orderBy: {
        name: descending == "true" ? "desc" : "asc", // Sort the results based on the descending parameter
      },
      skip: page ? (page - 1) * 10 : 0, // Apply pagination based on the page parameter
      take: 10, // Limit the number of results per page
    });

    // Transform the fetched admins
    const transformedUsers = await Promise.all(
      admins.map(async (element, index) => {
        return {
          index: index + 1,
          name: `${element.firstname} ${element.lastname}`,
          ...element,
          status: element.status,
        };
      })
    );
    const total = await prisma.admin.count({
      where: {
        role: 1,
      },
    });
    return Response.json({
      data: transformedUsers,
      message: "Success",
      success: true,
      totalResults: total,
    });
  } catch (error) {
    console.error("error:", error);
    return Response.json({
      message: "Something went wrong",
      data: { ...error },
      success: false,
    });
  }
}

/**
 * Handles PUT request to update an admin's details.
 * Validates the request body for required fields, then updates the admin's details
 * in the database. If the admin's password is updated, it is encrypted before being
 * stored. Returns a JSON response indicating the outcome of the operation.
 *
 * @param {Request} request - The request object from the client.
 * @returns {Promise<Response>} A Promise that resolves to a JSON response.
 */
export async function PUT(request) {
  try {
    // Verify the token and return it if it's not valid
    const tokenData = await verifyToken();
    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Parse the request body
    const data = await request.json();

    // Define validation rules
    const ValidatorRules = {
      userName: "required",
      name: "required",
      mobileno: "required",
      email: "required",
    };

    // Validate request data against the rules
    const { error, status } = await new Promise((resolve) => {
      validator(data, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    // If validation fails, return an error response
    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Update admin details in the database
    const userId = data.id;
    delete data.id;
    await prisma.admin.update({
      where: {
        id: userId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Encrypt and update password if provided
    if (data.password) {
      await prisma.admin.update({
        where: {
          id: userId,
        },
        data: {
          password: encrypt(data.password),
        },
      });
    }

    // Return success response
    return Response.json({
      success: true,
      message: "Successfully updated admin",
    });
  } catch (error) {
    // Log and return error response
    console.error("error:", error);
    return Response.json({
      message: "Something went wrong",
      data: { ...error },
      success: false,
    });
  }
}

/**
 * Handles the DELETE request to delete an admin.
 * Verifies the JWT token from the request headers and deletes the admin from the database.
 * 
 * @param {Request} request - The request object from the client.
 * @returns {Promise<Response>} A promise that resolves to a JSON response.
 */
export async function DELETE(request) {
  try {
    // Verify the JWT token from the request headers
    const tokenData = await verifyToken();
    if (!tokenData.success) {
      // If the token verification fails, return an error message
      return Response.json(tokenData);
    }

    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("employeeId"); // Get the userId parameter

    // Delete the admin from the database
    await prisma.admin.delete({
      where: {
        id: userId,
      },
    });

    // Return a success response
    return Response.json({
      success: true,
      message: "Successfully deleted admin",
    });
  } catch (error) {
    // Log and return error response
    console.error("error:", error);
    return Response.json({
      message: "Something went wrong",
      data: { ...error },
      success: false,
    });
  }
}
