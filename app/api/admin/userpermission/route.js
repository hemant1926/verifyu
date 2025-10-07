import validator from "@/helper/validate";
import { verifyToken } from "@/helper/jwtConfig";
import { PrismaClient } from "@prisma/client";
import { generateOTP } from "@/helper/otpProvider";
import { decrypt, encrypt } from "@/helper/security";
import { StoreImage } from "@/helper/store-image";
import { sendOTPSms } from "@/helper/sendOTPSms";
const prisma = new PrismaClient();
/**
 * Handles GET requests for fetching OTP for a user.
 * 
 * @param {Request} request - The request object.
 * @returns {Promise<Response>} - A promise that resolves to a Response object.
 */
export async function GET(request) {
  try {
    // Verify the token and get the admin data
    const tokenData = await verifyToken();
    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    // Check if the admin exists and has the correct role
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        status: 1,
        role: 2,
      },
    });
    if (!admin) {
      return Response.json({
        message: "Admin not found or this Admin don't have permission",
        success: false,
        data: {},
      });
    }

    // Extract the user id from the URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("userId");

    // Validate the user id parameter
    const { error, status } = await new Promise((resolve) => {
      validator(
        {
          userId: id,
        },
        {
          userId: "required",
        },
        {},
        (error, status) => {
          resolve({ error, status });
        }
      );
    });

    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) {
      return Response.json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    // Generate and store the OTP
    const otp = generateOTP().toString();
    const otpData = await prisma.otp.upsert({
      where: {
        mode: user.mobileno,
      },
      create: {
        mode: user.mobileno,
        otp: encrypt(otp),
      },
      update: {
        otp: encrypt(otp),
        updatedAt: new Date(),
      },
    });

    // Send the OTP to the user's mobile number
    await sendOTPSms({
      number: user.mobileno,
      otp: otpData.otp
    });

    // Return a success response
    return Response.json({
      success: true,
      message: "OTP fetched successfully",
      data: {
      },
    });
  } catch (error) {
    // Log and return an error response if an exception occurs
    console.error("error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
      data: { ...error },
    });
  }
}

/**
 * Handles the PUT request to update user details.
 * Validates the incoming request data, updates the user record in the database, and returns the updated user details.
 * 
 * @param {Request} req - The incoming request object containing user details and photo.
 * @returns {Response} A JSON response indicating the result of the user details update process.
 */
export async function PUT(req) {
  try {
    // Verify the token and get the admin data
    const adminTokenData = await verifyToken();
    if (!adminTokenData.success) {
      return Response.json(adminTokenData);
    }
    const admin = await prisma.admin.findUnique({
      where: {
        id: adminTokenData.data.id,
        status: 1,
        role: 2,
      },
    });
    if (!admin) {
      return Response.json({
        message: "Admin not found or this Admin don't have permission",
        success: false,
        data: {},
      });
    }

    // Parse and validate form data
    const formData = await req.formData();
    const ValidatorRules = {
      mobileno: "required",
      firstname: "required",
      lastname: "required",
      bloodType: "required",
      dateofbirth: "required",
      aadharno: "required",
      currentAddress: "required",
      permanentAddress: "required",
      geolocation: "required",
      emergencyDetails: "required",
      email: "required",
      gender: "required",
      mode: "required",
      otp: "required",
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

    // Extract the necessary data from the form data
    const mode = formData.get("mode");
    const otp = formData.get("otp");

    // Validate the OTP
    const otpData = await prisma.otp.findFirst({
      where: {
        mode: mode.toString(),
      },
    });
    if (!otpData || decrypt(otpData.otp) !== otp.toString()) {
      return Response.json({
        success: false,
        data: {},
        message: "Invalid OTP",
      });
    }

    // Prepare the user data to be updated
    const userData = {
      mobileno: formData.get("mobileno"),
      firstname: formData.get("firstname"),
      middlename: formData.get("middlename"),
      lastname: formData.get("lastname"),
      bloodType: formData.get("bloodType"),
      dateofbirth: new Date(formData.get("dateofbirth")).toISOString(),
      aadharno: formData.get("aadharno"),
      panno: formData.get("panno"),
      email: formData.get("email"),
      currentAddress: formData.get("currentAddress"),
      permanentAddress: formData.get("permanentAddress"),
      gender: formData.get("gender"),
      medicalhistory: formData.get("medicalhistory"),
      allergydetails: formData.get("allergydetails"),
    };

    // Store the user photo if provided
    if (formData.get("photo") != null) {
      const photo = formData.get("photo");
      const imagePath = await StoreImage({
        image: photo,
        path: "users",
        id: formData.get("userId"),
      });
      userData.photo = imagePath;
    }

    // Update the emergency details
    await prisma.emergencyDetail.deleteMany({
      where: {
        userId: formData.get("userId"),
      },
    });
    const userDetails = await prisma.user.update({
      where: {
        id: formData.get("userId"),
      },
      data: {
        ...userData,
        emergencyDetails: {
          create: JSON.parse(formData.get("emergencyDetails")),
        },
      },
      include: {
        emergencyDetails: true,
      },
    });

    // Return a success response with the updated user details
    return Response.json({
      message: "User details fetched successfully",
      success: true,
      data: userDetails,
    });
  } catch (error) {
    // Log and return an error response if an exception occurs
    console.error("error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
      data: { ...error },
    });
  }
}
