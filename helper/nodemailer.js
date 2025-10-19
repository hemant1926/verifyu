import axios from "axios";
import nodemailer from "nodemailer";
/**
 * Sends an email using the Turbo SMTP API.
 *
 * @param {Object} mailOptions - The options for sending the email.
 * @param {string} mailOptions.to - The recipient's email address.
 * @param {string} mailOptions.subject - The subject of the email.
 * @param {string} [mailOptions.text] - The plain text content of the email.
 * @param {string} mailOptions.html - The HTML content of the email.
 * @return {Promise<boolean>} - A promise that resolves to true if the email is sent successfully, false otherwise.
 */
export async function sendMailBkp(mailOptions) {
    try {
        // Construct the API URL and request body
        const apiUrl = "https://api.turbo-smtp.com/api/v2/mail/send";
        const body = {
            "authuser": process.env.TURBO_USERNAME, // The username for authentication
            "authpass": process.env.TURBO_PASSWORD, // The password for authentication
            "from": process.env.TURBO_USERNAME, // The sender's email address
            "to": mailOptions.to, // The recipient's email address
            "subject": mailOptions.subject, // The subject of the email
            "content": mailOptions?.text, // The plain text content of the email (optional)
            "html_content": mailOptions.html, // The HTML content of the email
        }

        // Send the email using the API
        await axios.post(apiUrl, body);
        return true;
    } catch (error) {
        // Log any errors that occur and return false
        console.error(error);
        return false;
    }
}

export async function sendMail(mailOptions) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.NODEMAILER_USERNAME,
              pass: process.env.NODEMAILER_PASSWORD, // Use App Password, not your regular password
            }
        });

        // Email options
        const mailPayload = {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html
        };
        
        // Send email
        await transporter.sendMail(mailPayload);
        return true;

    } catch (error) {
        // Log any errors that occur and return false
        console.error(error);
        return false;
    }
}

export function getEmailVerificationMessage(otpCode) {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifyu - Email Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
              background: linear-gradient(to right, #632997, #9C4EDF);
              color: #fff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
          }
          .content {
              padding: 20px;
              color: #333;
          }
          h1 {
              /* font-size: 10px; */
              margin: 0;
          }
          p {
              font-size: 16px;
              margin-top: 10px;
              line-height: 1.5;
          }
          .otp {
              font-size: 28px;
              font-weight: bold;
              color: #9C4EDF;
              margin-top: 15px;
          }
          .note {
              font-size: 14px;
              color: #888;
              margin-top: 10px;
          }
         
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Verifyu</h1>
              <p>Email Verification</p>
          </div>
          <div class="content">
              <p>Dear Verifyu User,</p>
              <p>Your One-Time Password (OTP) for email verification is:</p>
              <p class="otp">${otpCode}</p>
              <p class="note">This OTP will expire in 10 minutes. Please use it to verify your email address and access your Verifyu account securely.</p>
              
              <p class="note">If you did not request this verification, please ignore this email.</p>
              <p>Thank you for verification of email</p>
          </div>
      </div>
  </body>
  </html>

 `;
}
