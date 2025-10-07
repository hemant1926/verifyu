import { verifyToken } from "@/helper/jwtConfig";
import { StoreImage } from "@/helper/store-image";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Handles the POST request to store customer support query.
 * Validates the incoming request data, stores the query file, and creates a new customer support record in the database.
 * 
 * @param {Request} req - The incoming request object containing query data and a file.
 * @returns {Response} A JSON response indicating the result of the query submission process.
 */
export const POST = async (req) => {
    try {
        // Verify user's token
        const tokenData = await verifyToken();

        if (!tokenData.success) {
            // If token verification failed, return the error response
            return Response.json(tokenData);
        }

        // Process form data from the request
        const formData = await req.formData();

        // Validate form data against predefined rules
        const ValidatorRules = {
            subjects: "required",
            message: "required",
        };
        const { error, status } = await new Promise((resolve) => {
            validator(
                { ...Object.fromEntries(formData) },
                ValidatorRules,
                {},
                (error, status) => {
                    resolve({ error, status });
                }
            );
        });

        if (!status) {
            // If validation failed, return the validation errors
            return Response.json({
                success: false,
                message: "validation error",
                data: { ...error.errors },
            });
        }


        // Check for the presence of a file in the form data
        const file = formData.get("file");
        if (!file) {
            // If no file is provided, return an error response
            return Response.json({
                success: false,
                message: "Please provide a file",
            });
        }

        // Store the file and get the file path
        let insertQuery = await prisma.customerSupport.create({
            data: {
                subjects: formData.get("subjects"),
                message: formData.get("message"),
                file: "",
                userId: tokenData.data.id,

            },
        });

        // Store the file and get the file path
        const filePath = await StoreImage({
            image: file,
            path: "support",
            id: insertQuery.id,
        });

        // Update the customer support record with the file path
        insertQuery = await prisma.customerSupport.update({
            where: {
                id: insertQuery.id,
            },
            data: {
                file: filePath,
            },
        });

        // Return a success response with the updated customer support record
        return Response.json({
            success: true,
            message: "Query submitted successfully",
            data: insertQuery,
        })

    } catch (error) {
        // Catch any unexpected errors and return a generic error response
        console.error("error:", error);
        return Response.json({
            message: "Something went wrong",
            data: { ...error },
            success: false,
        });
    }
}
