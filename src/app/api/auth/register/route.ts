import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { OtpToken } from "@/models/OtpToken";
import { adminAuth } from "@/lib/firebase-admin";


const MAX_ATTEMPTS = 5;

const schema = z.object({
  tokenId:     z.string().min(1),
  otp:         z.string().length(6).regex(/^\d+$/),
  displayName: z.string().min(2).max(60).trim(),
  password:    z.string().min(8),
  enrollmentYear: z.number().int().min(2015).max(new Date().getFullYear()),
  enrollmentNo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    await connectDB();

    // Find OTP record
    const otpRecord = await OtpToken.findById(data.tokenId);
    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP expired or invalid. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await OtpToken.findByIdAndDelete(data.tokenId);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(data.otp, otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = MAX_ATTEMPTS - otpRecord.attempts;
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 400 }
      );
    }

    // Check email not already registered (race condition guard)
    const existing = await User.findOne({ email: otpRecord.email });
    if (existing) {
      await OtpToken.findByIdAndDelete(data.tokenId);
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Determine role — superadmin if email matches env var
    const isSuperAdmin =
      process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === otpRecord.email.toLowerCase();

    // Create user
    await User.create({
      email:           otpRecord.email,
      displayName:     data.displayName,
      passwordHash,
      isEmailVerified: true,
      enrollmentYear:  data.enrollmentYear,
      enrollmentNo:    data.enrollmentNo,
      role:            isSuperAdmin ? "superadmin" : "user",
    });

    // Delete used OTP
    await OtpToken.findByIdAndDelete(data.tokenId);

    // Create Firebase Auth user so they can sign in with email/password
    try {
      await adminAuth.createUser({
        email:         otpRecord.email,
        password:      data.password,
        displayName:   data.displayName,
        emailVerified: true,
      });
    } catch (fbErr: unknown) {
      // If Firebase user already exists (e.g. re-registration after deletion), ignore
      if ((fbErr as { code?: string })?.code !== "auth/email-already-exists") {
        console.error("[register] Firebase user creation failed:", fbErr);
      }
    }

    return NextResponse.json({ success: true, email: otpRecord.email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
