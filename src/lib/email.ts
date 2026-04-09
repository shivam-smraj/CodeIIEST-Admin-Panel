import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.SMTP_EMAIL ?? "CodeIIEST <noreply@codeiiest.in>";

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "Your CodeIIEST Admin Portal OTP",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #1e1b4b; padding: 30px; text-align: center;">
            <img src="https://codeiiest.in/logo.png" alt="CodeIIEST Logo" style="height: 50px; margin-bottom: 15px;" />            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px;">&lt;CodeIIEST /&gt;</h1>
            <p style="color: #a5b4fc; margin-top: 8px; font-size: 14px;">Official Coding Club of IIEST Shibpur</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 22px;">Verify your identity</h2>
            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.5;">
              Here is the verification code you requested for the CodeIIEST Admin Portal. This code will expire in exactly <strong>10 minutes</strong>.
            </p>
            
            <!-- OTP Box -->
            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px;">
              <code style="color: #4338ca; font-size: 42px; font-weight: 700; letter-spacing: 14px; text-shadow: 1px 1px 0px rgba(0,0,0,0.05);">${otp}</code>
            </div>
            
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
              If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    throw new Error(error.message || "Failed to send email via SMTP");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: "Reset your CodeIIEST Admin Portal password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #1e1b4b; padding: 30px; text-align: center;">
            <img src="https://codeiiest.in/logo.png" alt="CodeIIEST Logo" style="height: 50px; margin-bottom: 15px;" />            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px;">&lt;CodeIIEST /&gt;</h1>
            <p style="color: #a5b4fc; margin-top: 8px; font-size: 14px;">Official Coding Club of IIEST Shibpur</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 22px;">Password Reset Request</h2>
            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.5;">We received a request to reset the password for your CodeIIEST Admin Portal account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #4338ca; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">Reset Password</a>
            </div>
            <p style="margin: 0 0 10px; color: #64748b; font-size: 14px; line-height: 1.5;">This link will expire in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; word-break: break-all;">Or copy this link into your browser: <br/>${resetUrl}</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    throw new Error(error.message || "Failed to send email via SMTP");
  }
}

