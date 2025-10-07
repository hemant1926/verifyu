import { generateToken, verifyToken } from "@/helper/jwtConfig";
import { decrypt, encrypt } from "@/helper/security";
import validator from "@/helper/validate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * Handles the POST request to sign up a new admin or employee.
 * Validates the incoming request data, checks for existing users with the same email and role,
 * encrypts the password, and creates a new admin or employee record in the database.
 * 
 * @param {Request} req - The incoming request object containing user data.
 * @returns {Promise<Response>} A Promise that resolves to a JSON response indicating the result of the signup process.
 */
export async function POST(req) {
  try {
    // Parse and validate form data
    const data = await req.json();

    // Define validation rules
    const ValidatorRules = {
      userName: "required",
      name: "required",
      mobileno: "required",
      email: "required",
      password: "required",
      role: "required",
    };

    // Validate form data against predefined rules
    const { error, status } = await new Promise((resolve) => {
      validator(data, ValidatorRules, {}, (error, status) => {
        resolve({ error, status });
      });
    });

    // Respond with validation errors if any
    if (!status) {
      return Response.json({
        success: false,
        message: "validation error",
        data: { ...error.errors },
      });
    }

    // Check for existing user with the same email and role
    const checkUser = await prisma.admin.findUnique({
      where: {
        email: data.email,
      },
    });

    if (checkUser && checkUser.role !== data.role) {
      return Response.json({
        success: false,
        message: `User already exists as ${checkUser.role == 2 ? "admin" : "employee"}`,
      });
    }

    // Encrypt password
    const encryptedPassword = encrypt(data.password);

    // Upsert admin or employee record into the database
    const user = await prisma.admin.upsert({
      where: {
        email: data.email,
      },
      create: {
        userName: data.userName,
        name: data.name,
        mobileno: data.mobileno,
        email: data.email,
        password: encryptedPassword,
        role: data.role,
      },
      update: {
        userName: data.userName,
        name: data.name,
        mobileno: data.mobileno,
        password: encryptedPassword,
        role: data.role,
      },
    });

    return Response.json({
      success: true,
      message: "Signup successfully",
      data: {
        ...user,
      },
    });
  } catch (error) {
    console.error("error", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
}

export async function GET(request) {
  try {
    const ValidatorRules = {
      userName: "required",
      password: "required",
    };
    const { searchParams } = new URL(request.url);

    const { error, status } = await new Promise((resolve) => {
      validator(
        {
          userName: searchParams.get("userName"),
          password: searchParams.get("password"),
        },
        ValidatorRules,
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

    const admin = await prisma.admin.findUnique({
      where: {
        status: 1,
        userName: searchParams.get("userName"),
      },
      select: {
        id: true,
        userName: true,
        name: true,
        mobileno: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!admin || decrypt(admin.password) !== searchParams.get("password")) {
      return Response.json({
        success: false,
        message: "User not found or deactivated",
      });
    }
    const token = generateToken({
      id: admin.id,
      role: admin.role,
    });
    return Response.json({
      success: true,
      message: "Logged in successfully",
      data: {
        ...admin,
        token,
      },
    });
  } catch (error) {
    console.error("error", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
}


export async function PUT(req) {

  try {

    const tokenData = await verifyToken();

    if (!tokenData.success) {
      return Response.json(tokenData);
    }

    const ValidatorRules = {
      oldPassword: "required",
      password: "required",
    };
    const { oldPassword, password } = await req.json()
    const { error, status } = await new Promise((resolve) => {
      validator({ password, oldPassword }, ValidatorRules, {}, (error, status) => {
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
    const admin = await prisma.admin.findUnique({
      where: {
        id: tokenData.data.id,
        role: 2
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!admin) {
      return Response.json({
        success: false,
        message: "admin not found",
      });
    }
    if (decrypt(admin.password) !== oldPassword) {
      return Response.json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    await prisma.admin.update({
      where: {
        id: tokenData.data.id,
        role: 2
      },
      data: {
        password: encrypt(password),
      },
    });
    return Response.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("error", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    });
  }
}

