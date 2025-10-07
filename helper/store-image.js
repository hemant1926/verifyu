import { Bucket, removeImage, uploadAndSetACL } from "./awsS3Config";

/**
 * Store an image in AWS S3 bucket.
 *
 * @param {Object} options - The options for storing the image.
 * @param {File} options.image - The image file to be stored.
 * @param {string} options.path - The path in the bucket where the image will be stored.
 * @param {string} options.id - The ID of the user.
 * @returns {Promise<string>} The URL of the stored image or an empty string if an error occurred.
 */
export async function StoreImage({ image, path, id }) {
  // Get the byte array of the image
  const bytes = await image.arrayBuffer();
  // Convert the byte array to a buffer
  const buffer = Buffer.from(bytes);
  // Get the extension of the image
  const imageNameArray = image.name.split(".");
  const ext = imageNameArray[imageNameArray.length - 1];
  // Get the current date and convert it to a string in the format "YYYY-MM-DDTHH-MM-SS"
  const currentDate = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  // Generate the name of the image file
  const imageName = `${id}-${currentDate}.${ext}`;

  // Set the parameters for storing the image in the S3 bucket
  let params = {
    Bucket: Bucket,
    Key: `${path}/${imageName}`, // The path in the bucket where the image will be stored
    Body: buffer, // The image file as a buffer
    ACL: 'public-read', // Make the image publicly readable
  };

  try {
    // Store the image in the S3 bucket and return the URL of the stored image
    return await uploadAndSetACL(params);
  } catch (err) {
    // Log the error and return an empty string if an error occurred
    console.error('ERROR MSG: ', err);
    return ''
  }
}


/**
 * Delete an image from the AWS S3 bucket.
 *
 * @param {Object} options - The options for deleting the image.
 * @param {string} options.image - The URL of the image to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the image is deleted.
 */
export async function DeleteImage({ image }) {
  // Extract the file name from the image URL
  const fileName = image.split('/').pop();

  // Set the parameters for deleting the image from the S3 bucket
  var params = {
    Bucket: Bucket,
    Key: `users/${fileName}`, // The path in the bucket where the image is stored
    // The full path name to the image file without '/' at the beginning
  };

  // Call the function to delete the image from the S3 bucket
  await removeImage(params);
} 
