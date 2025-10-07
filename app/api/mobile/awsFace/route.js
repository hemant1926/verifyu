import { indexFaces } from "@/helper/awsRekognition";
// import fs from "fs";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "@/helper/jwtConfig";
const prisma = new PrismaClient();


/**
 * Handles the POST request to index faces for a user and store them in the database.
 * Validates the incoming request data, indexes faces, and stores them in the database.
 * Returns a JSON response indicating the result of the operation.
 *
 * @param {Request} request - The incoming request object containing form data.
 * @returns {Promise<Response>} A JSON response indicating the result of the operation.
 */
export async function POST(request) {
    try {
        // Parse form data
        const formData = await request.formData();

        // Define validation rules
        const ValidatorRules = {
            userId: "required",
            files: "required",
        };

        // Validate form data against predefined rules
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

        // Respond with validation errors if any
        if (!status) {
            return Response.json({
                success: false,
                message: "validation error",
                data: { ...error.errors },
            });
        }

        // Get files from form data
        const files = formData.getAll('files');

        // Index faces for each file
        const rekognitionResponseFaceRecords = await Promise.all(files.map(file => indexFaces({ file })));

        // Extract face IDs from the face records
        let faceIndex = rekognitionResponseFaceRecords.map(record => record.at(0).Face.FaceId);

        // Upsert face IDs for the user
        await prisma.awsFace.upsert({
            where: {
                userId: formData.get("userId"),
            },
            create: {
                userId: formData.get("userId"),
                faceIds: {
                    set: faceIndex
                },
            },
            update: {
                faceIds: {
                    push: faceIndex
                }
            }
        });

        // Generate token for the user if it's a new user
        var token = formData.get("isNewUser") ? generateToken({ id: formData.get("userId") }) : "";

        // Return a JSON response indicating the result of the operation
        return Response.json({
            success: true,
            message: "Success",
            data: {
                token
            },
        });
    } catch (error) {
        console.error("error:", error);
        // Return a JSON response indicating the error if any
        return Response.json({
            success: false,
            message: "Something went wrong",
            data: { ...error },
        });
    }
}



