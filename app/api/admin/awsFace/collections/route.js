import { createCollection, deleteCollection } from "@/helper/awsRekognition";


/**
 * Handles the POST request to create a new AWS Rekognition collection.
 *
 * @return {Promise<Response>} A JSON response indicating the success or failure of the operation.
 */
export async function POST() {
    try {
        // Call the AWS Rekognition service to create a new collection.
        const collectionResponse = await createCollection();

        // Return success response with the collection response.
        return Response.json({
            success: true,
            message: "Success",
            data: {
                collectionResponse
            },
        });
    } catch (error) {
        // Log and return error in case of an exception.
        console.error("error:", error);
        return Response.json({
            success: false,
            message: "Something went wrong",
            data: { ...error },
        });
    }
}





/**
 * Handles the DELETE request to delete an AWS Rekognition collection.
 *
 * @return {Promise<Response>} A JSON response indicating the success or failure of the operation.
 */
export async function DELETE() {
    try {
        // Call the AWS Rekognition service to delete a collection.
        const deletedUse = await deleteCollection();

        // Return success response with the collection response.
        return Response.json({
            success: true,
            message: "Success",
            data: {
                deletedUse
            },
        });
    } catch (error) {
        // Log and return error in case of an exception.
        console.error("error:", error);
        return Response.json({
            success: false,
            message: "Something went wrong",
            data: { ...error },
        });
    }
}
