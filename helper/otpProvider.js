
export function generateOTP() {
    // Generate a random number between 0 and 9999, then pad with zeros if necessary to ensure it's always 4 digits
    const otp = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return otp;
  }