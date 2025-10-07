import admin from "firebase-admin";
import serviceAccount from "@/assets/fcm/serviceAccountKey.json";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Sends a message using Firebase Cloud Messaging (FCM).
 *
 * @param {Object} payload - The payload containing the message details.
 * @param {string} payload.token - The FCM token of the recipient.
 * @param {Object} payload.data - The data payload of the message.
 * @returns {Promise} A promise that resolves with the response from FCM.
 */
export async function sendMsgFunction({ payload }) {

  // Send the message using Firebase Admin SDK
  let response;
  try {
    response = await admin.messaging().send(payload);
  } catch (error) {
    // Log any errors that occur during the message sending process
    console.error("fcm error:", error);
  }

  // Return the response from FCM
  return response;
}
