import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { OtpToken } from "@/models/OtpToken";
import { sendOtpEmail } from "@/lib/email";
import { isCollegeEmail } from "@/lib/auth";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const normalizedEmail = email.toLowerCase();

    // Validate college email domain
    if (!isCollegeEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Only IIEST college email addresses are allowed (@students.iiests.ac.in or *.iiests.ac.in)" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email is already registered
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in instead." },
        { status: 409 }
      );
    }

    // Delete any existing OTP for this email (allow re-send)
    await OtpToken.deleteMany({ email: normalizedEmail, purpose: "registration" });

    // Generate and hash OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store hashed OTP (TTL index handles cleanup after 10 min)
    const otpRecord = await OtpToken.create({
      email: normalizedEmail,
      otpHash,
      purpose: "registration",
    });

    // Send OTP via Resend
    await sendOtpEmail(normalizedEmail, otp);

    return NextResponse.json({
      message: "OTP sent successfully. Check your college email.",
      tokenId: otpRecord._id.toString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("[OTP/send]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
