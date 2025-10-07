import { sendMsgFunction } from "@/helper/fcmConfig";
import { PrismaClient } from "@prisma/client";
import { sendMail } from "@/helper/nodemailer";
import { detectFaces } from "@/helper/awsRekognition";
const prisma = new PrismaClient();




/**
 * @description
 * This API endpoint is used to detect a face in an image and find the user
 * associated with that face in the database.
 * @param {Request} req - The request object.
 * @returns {Response} - The response object.
 */
export async function POST(req) {
  try {

    // Get the image from the request body
    const formData = await req.formData();
    const image = formData.get("file");

    // Detect faces in the image
    const detectFacesResponse = await detectFaces({ file: image });
    if (detectFacesResponse.FaceMatches.length == 0) {
      throw new Error("No face detected");
    }

    // Get the face ID from the response
    const faceId = detectFacesResponse.FaceMatches.at(0).Face.FaceId;

    // Find the user associated with the face ID in the database
    const awsFaceData = await prisma.awsFace.findFirst({
      where: {
        faceIds: {
          has: faceId
        },
        status: 1
      },
      include: {
        user: {
          include: {
            emergencyDetails: true
          }
        }
      },
    });
    if (!awsFaceData) {
      return Response.json(
        {
          data: {},
          message: "User not found",
          success: false,
        }
      );
    }

    // Get the user data from the database
    const userData = awsFaceData.user;
    if (userData.notification && userData.token) {
      // Prepare the payload for the notification
      const payload = {
        token: userData.token,
        notification: {
          title: `VerifyU`,
          body: `Someone has visited your profile.`,
        },

        android: {
          priority: "HIGH",
          notification: {
            title: `VerifyU`,
            body: `Someone has visited your profile.`,
            channel_id: "high_importance_channel",
          },
        },

        data: {
          body: `Someone has visited your profile.`,
        },
      };

      // Send the notification
      await sendMsgFunction({ payload: payload });
    }
    if (userData.emailVerifcation) {
      // Prepare the email options
      const mailOptions = {
        from: process.env.NODEMAILER_USERNAME,
        to: userData.email,
        subject: "Email Verification",
        text: `Someone has visited your profile.`,
      };

      // Send the email
      await sendMail(mailOptions);
    }

    return Response.json(
      {
        data: userData,
        message: "user found",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in fetching user: ", error);
    return Response.json(
      {
        data: {},
        message: "Error in fetching user",
        success: false,
      },
      { status: 200 }
    );
  }

}
