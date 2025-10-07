import { verifyToken } from "@/helper/jwtConfig";
import { getEmailVerificationMessage, sendMail } from "@/helper/nodemailer";
import { generateOTP } from "@/helper/otpProvider";
import { decrypt, encrypt } from "@/helper/security";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * Handles PUT requests to update the user's notification preference.
 *
 * @param {Object} request - The request object.
 * @param {Object} request.json - The request body containing the updated notification key.
 * @returns {Promise<Object>} - A promise that resolves to a JSON object containing the response data.
 */
export const PUT = async (request) => {
  try {
    // Verify the user's token
    const token = await verifyToken();

    // If the token verification fails, return the token error response
    if (!token.success) {
      return Response.json(token);
    }

    // Extract the notification key from the request body
    const { notificationKey } = await request.json();

    // Define the validation rules for the notification key
    const ValidatorRules = {
      notificationKey: "required",
    };

    // Validate the notification key against the defined rules
    const { error, status } = await new Promise((resolve) => {
      validator({ notificationKey }, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    // If the validation fails, return the validation error response
    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Update the user's notification preference in the database
    const updateUserData = await prisma.user.update({
      where: {
        id: token.data.id,
      },
      data: {
        notification: notificationKey,
      },
    });

    // Return a success response with the updated user data
    return Response.json({
      success: true,
      message: "User notification updated successfully",
      data: updateUserData,
    });
  } catch (error) {
    // Log the error and return a generic error response
    console.error("error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const POST = async (request) => {
  try {
    const token = await verifyToken();

    if (!token.success) {
      return Response.json(token);
    }

    const { otp, mode } = await request.json();
    const ValidatorRules = {
      otp: "required",
      mode: "required",
    };

    const { error, status } = await new Promise((resolve) => {
      validator({ otp, mode }, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }
    const otpData = await prisma.otp.findFirst({
      where: {
        mode,
      },
    });

    if (!otpData || decrypt(otpData.otp) !== otp) {
      return Response.json({
        success: false,
        message: "Invalid OTP",
        data: {},
      });
    }

    const thirtyMinutesAgo = Date.now() - 1000 * 60 * 30; // 30 minutes ago
    if (otpData.updatedAt.getTime() < thirtyMinutesAgo) {
      return Response.json({
        success: false,
        message: "OTP expired",
        data: {},
      });
    }
    await prisma.user.update({
      where: {
        id: token.data.id,
      },
      data: {
        emailVerifcation: true,
      },
    });

    return Response.json({
      success: true,
      message: "Email verified successfully",
      data: {},
    });
  } catch (error) {
    console.error("error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const GET = async () => {
  try {
    const token = await verifyToken();

    if (!token.success) {
      return Response.json(token);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.data.id,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    const otp = encrypt(generateOTP().toString());
    await prisma.otp.upsert({
      where: {
        mode: user.email,
      },
      create: {
        mode: user.email,
        otp: otp,
      },
      update: {
        otp: otp,
        updatedAt: new Date(),
      },
    });

    // Prepare email options
    const mailOptions = {
      from: process.env.NODEMAILER_USERNAME,
      to: user.email,
      subject: "Email Verification",
      html: getEmailVerificationMessage(decrypt(otp)),
    };

    // Send the email
    const mailStatus = await sendMail(mailOptions);
    if (!mailStatus) {
      throw new Error("Something went wrong while sending email");
    }
    return Response.json({
      success: true,
      message: "User email fetched successfully",
      data: { email: user.email },
    });
  } catch (error) {
    console.error("error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
};
