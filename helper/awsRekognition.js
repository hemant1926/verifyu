import { Rekognition } from "aws-sdk";



var rekognition = new Rekognition();


rekognition.config.update({
    accessKeyId: process.env.AWS_REKOGNITION_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_REKOGNITION_SECRET_ACCESS_KEY || "",
});



/**
 * Indexes faces from an image in the 'verifyu-users' collection.
 *
 * @param {Object} options - The options for indexing faces.
 * @param {File} options.file - The image file containing the faces to be indexed.
 * @return {Promise} A promise that resolves to an array of face records.
 */
export async function indexFaces({ file }) {
    // Call the AWS Rekognition service to index faces from an image in the 'verifyu-users' collection.
    // The image file is specified in the 'Image' property of the options object.
    // The 'DetectionAttributes' property specifies the attributes to be detected.
    // The maximum number of faces to be detected is set to 1 and the quality filter is set to 'AUTO'.
    const rekognitionResponse = await rekognition.indexFaces(
        {
            CollectionId: "verifyu-users",
            Image: {
                Bytes: await file.arrayBuffer(),
            },
            DetectionAttributes: [
                "ALL",
            ],
            MaxFaces: 1,
            QualityFilter: "AUTO"
        }, function (err) {
            if (err) {
                console.error("error", err, err.stack)
            }
        }
    ).promise();

    // Return the array of face records from the response.
    return rekognitionResponse.FaceRecords;
}



/**
 * Detects faces in an image and searches for a match in the 'verifyu-users' collection.
 *
 * @param {Object} options - The options for detecting and searching for faces.
 * @param {File} options.file - The image file containing the faces to be detected and searched for.
 * @return {Promise} A promise that resolves to the response from the AWS Rekognition service.
 */
export async function detectFaces({ file }) {

    // Detect faces in the image and search for a match in the 'verifyu-users' collection.
    // The image file is specified in the 'Image' property of the options object.
    // The maximum number of faces to be detected is set to 1 and the face match threshold is set to 80.
    const searchFaceResponse = rekognition.searchFacesByImage({
        CollectionId: 'verifyu-users',
        Image: {
            Bytes: await file.arrayBuffer(),
        },
        MaxFaces: 1,
        FaceMatchThreshold: 80
    }).promise();

    return searchFaceResponse;

}


/**
 * Retrieves a list of faces from the 'verifyu-users' collection.
 *
 * @return {Promise} A promise that resolves to the list of faces.
 */
export async function listFaces() {
    // Call the AWS Rekognition service to retrieve a list of faces from the 'verifyu-users' collection.
    // The collection ID is specified in the 'CollectionId' property of the options object.
    return await rekognition.listFaces({
        CollectionId: 'verifyu-users',

    }).promise();
}


/**
 * Deletes one or more faces from the 'verifyu-users' collection.
 *
 * @param {Object} options - The options for deleting the faces.
 * @param {string[]} options.faceIds - The IDs of the faces to be deleted.
 * @return {Promise} A promise that resolves to the response from the AWS Rekognition service.
 */
export async function deleteFaces({ faceIds }) {
    // Call the AWS Rekognition service to delete one or more faces from the 'verifyu-users' collection.
    // The collection ID and the IDs of the faces to be deleted are specified in the options object.
    return await rekognition.deleteFaces({
        CollectionId: 'verifyu-users',
        FaceIds: faceIds
    }).promise();
}


/**
 * Deletes a collection in AWS Rekognition.
 *
 * @return {Promise} A promise that resolves to the response from the AWS Rekognition service.
 */
export async function deleteCollection() {
    // Call the AWS Rekognition service to delete a collection.
    // The collection ID is specified in the 'CollectionId' property of the options object.
    return await rekognition.deleteCollection({
        CollectionId: 'verifyu-users'
    }).promise();
}



/**
 * Creates a new collection in AWS Rekognition.
 *
 * @return {Promise} A promise that resolves to the response from the AWS Rekognition service.
 */
export async function createCollection() {
    // Call the AWS Rekognition service to create a new collection.
    // The collection ID is specified in the 'CollectionId' property of the options object.
    return await rekognition.createCollection({
        CollectionId: 'verifyu-users'
    }).promise();
}


/**
 * Retrieves a list of faces from the 'verifyu-users' collection.
 *
 * @return {Promise} A promise that resolves to the list of faces.
 */
export async function getFacesFromCollection() {
    // Call the AWS Rekognition service to retrieve a list of faces from the 'verifyu-users' collection.
    // The collection ID is specified in the 'CollectionId' property of the options object.
    return await rekognition.listFaces({
        CollectionId: 'verifyu-users'
    }).promise();
}

