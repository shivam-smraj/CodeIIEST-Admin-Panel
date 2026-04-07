import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json());

    // Verify JWT
    let decoded: { email: string; jti: string };
    try {
      decoded = jwt.verify(token, process.env.AUTH_SECRET!) as { email: string; jti: string };
    } catch {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    await connectDB();

    // Check token hasn't been used
    const storedToken = await PasswordResetToken.findOne({ jti: decoded.jti });
    if (!storedToken || storedToken.used) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { email: decoded.email },
      { $set: { passwordHash } }
    );

    // Mark token as used
    storedToken.used = true;
    await storedToken.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}
