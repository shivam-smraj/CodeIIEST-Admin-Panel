import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());
    const normalizedEmail = email.toLowerCase();

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Delete any existing reset tokens for this email
    await PasswordResetToken.deleteMany({ email: normalizedEmail });

    // Create a signed JWT (15 min expiry) with unique jti
    const jti = randomUUID();
    const token = jwt.sign(
      { email: normalizedEmail, jti },
      process.env.AUTH_SECRET!,
      { expiresIn: "15m" }
    );

    // Store jti in DB (for one-time use invalidation)
    await PasswordResetToken.create({ jti, email: normalizedEmail });

    const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
