import { generateToken } from "@/helper/jwtConfig";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles POST request to create or update user face data.
 * Validates the request body for required fields, then either creates or updates
 * the user's face data in the database. Generates a token for the user upon success.
 * 
 * @param {Request} req - The request object from the client.
 * @returns {Response} A JSON response indicating the outcome of the operation.
 */
export async function POST(req) {
  try {
    // Parse the request body
    const data = await req.json();

    // Define validation rules
    const ValidatorRules = {
      faceArray: "required",
      userId: "required",
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

    // Upsert user face data into the database
    await prisma.faceData.upsert({
      where: {
        userId: data.userId,
      },
      create: {
        userId: data.userId,
        faceArray: data.faceArray,
      },
      update: {
        faceArray: data.faceArray,
        updatedAt: new Date(),
      },
    });

    // Generate a token for the user
    const token = generateToken({ id: data.userId });
    // Return success response with token
    return Response.json({
      success: true,
      message: "User Face Data created and updated successfully",
      data: {
        token,
      },
    });
  } catch (error) {
    // Log and return error if operation fails
    console.error("error", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
      data: { ...error },
    });
  }
}
