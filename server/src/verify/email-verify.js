import dotenv from "dotenv";
dotenv.config();
export const sendOtpEmail = async (email, otp) => {
  try {
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Chat App",
            email: process.env.EMAIL_FROM,
          },
          to: [{ email }],
          subject: "Chat App - Email Verification OTP",
          htmlContent: `
            <h2>Email Verification</h2>
            <p>Your verification OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
          `,
        }),
      }
    );

    const data = await response.json();
if (!response.ok) {
  throw new Error("OTP email sending failed");
}

return data;

  } catch (error) {
    console.error("Email Error:", error.message);
    throw error;
  }
};
