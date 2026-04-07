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
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
        <h2 style="color:#6366f1;margin-top:0;">CodeIIEST Admin Portal</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;margin:24px 0;color:#fff;text-align:center;background:#1e293b;padding:16px;border-radius:8px;">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
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
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
        <h2 style="color:#6366f1;margin-top:0;">CodeIIEST Admin Portal</h2>
        <p>We received a request to reset your password. Click the button below:</p>
        <a href="${resetUrl}" 
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:14px;">This link expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
        <p style="color:#475569;font-size:12px;">Or copy this link: ${resetUrl}</p>
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
