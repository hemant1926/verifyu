import { listFaces } from "@/helper/awsRekognition";
import { getFile } from "@/helper/awsS3Config";
import { verifyToken } from "@/helper/jwtConfig";

/**
 * Handles the GET request to list all faces from the AWS Rekognition collection.
 * 
 * This function first verifies the user's token. If the token is valid, it then
 * retrieves a list of faces from the AWS Rekognition service. The response includes
 * the success status, a message, and the list of faces. In case of failure, it returns
 * an error message and logs the error.
 * 
 * @returns {Promise<Response>} A JSON response with the list of faces or an error message.
 */
export async function GET() {
    try {
        // Verify the JWT token.
        const tokenData = await verifyToken();
        if (!tokenData.success) {
            // If token verification fails, return the failure response.
            return Response.json(tokenData);
        }
        // Retrieve a list of faces from the AWS Rekognition collection.
        const listOFFace = await listFaces();
        // Return success response with the list of faces.
        return Response.json({
            success: true,
            message: "List of faces",
            data: { ...listOFFace },
        })
    } catch (error) {
        // Log and return error in case of an exception.
        console.error("error:", error);
        return Response.json({
            success: false,
            message: "Something went wrong",
            data: { ...error },
            error
        });
    }
}
