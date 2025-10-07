import { verify, sign } from "jsonwebtoken";
import { encrypt, decrypt } from "@/helper/security";
import { headers } from "next/headers";

/**
 * Verifies the JWT token from the request headers.
 *
 * @returns {Promise<Object>} An object containing the verification status,
 * data, and a message.
 */
export async function verifyToken() {
  try {

    // Get the request headers
    const headersList = headers();

    // Extract the token from the headers
    const token = headersList.get("x-access-token");

    // If no token is provided, return an error message
    if (!token) {
      return {
        message: "A Token is Required for Authentication",
        success: false,
        data: {},
      };
    }

    // Decrypt the token
    const _decryptToken = decrypt(token);

    // Verify the token using the secret key
    let decodedData = verify(
      _decryptToken,
      process.env.JWT_SECRET_KEY || ""
    );

    // If the decoded data is not an object, set it to an empty object
    if (typeof decodedData !== "object") {
      decodedData = {};
    }

    // Return the verification status, data, and a success message
    return {
      success: true,
      data: decodedData.data,
      message: "Token Verified",
    };
  } catch (error) {
    // If there is an error, return an error message
    return {
      success: false,
      data: {},
      message: error.message,
    };
  }
}
/**
 * Generates a JSON Web Token with the provided data.
 * @param {Object} data - The data to be included in the token.
 * @returns {string} - The encrypted token.
 */
export function generateToken(data) {
  // Include the issued at timestamp in the data
  data.iat = Date.now();

  // Generate the token with the provided data and secret key, set to expire in 10 days
  const token = sign({ data }, process.env.JWT_SECRET_KEY || "", {
    expiresIn: "10d",
  });

  // Encrypt the token and return it
  return encrypt(token);
}
