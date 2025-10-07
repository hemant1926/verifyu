import { decrypt } from "./security";

/**
 * Sends an OTP (One-Time Password) SMS to the provided phone number.
 *
 * @param {Object} options - The options for sending the OTP SMS.
 * @param {string} options.number - The phone number to send the OTP SMS to.
 * @param {string} options.otp - The OTP to be sent.
 * @returns {Promise<Object|Error>} - A promise that resolves to the response object or rejects with an error.
 */
export async function sendOTPSms({ number, otp }) {
    try {
        // Send POST request to the Msg91 API to send the OTP SMS
        const response = await fetch("https://control.msg91.com/api/v5/flow", {
            method: "POST",
            headers: {
                "authkey": '257307Aln3uYWy15c9b8632', // Msg91 API auth key
                "accept": 'application/json',
                "content-type": 'application/JSON'
            },
            body: JSON.stringify({
                "template_id": "668696b8d6fc0561252c2cb2", // Msg91 template ID for OTP SMS
                "short_url": "0",
                "recipients": [
                    {
                        "mobiles": number, // Phone number to send the OTP SMS to
                        "otp": decrypt(otp), // Decrypted OTP to be sent
                    }
                ]
            }),
        });

        // Return the response as JSON
        return await response.json()
    } catch (error) {
        // Log the error and return it
        console.error(error);
        return error
    }
}
