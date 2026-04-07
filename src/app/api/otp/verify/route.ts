import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { OtpToken } from "@/models/OtpToken";

const schema = z.object({
  tokenId: z.string().min(1),
  otp:     z.string().length(6).regex(/^\d+$/),
});

// Verify OTP without creating the user (used between step 2 and step 3)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId, otp } = schema.parse(body);

    await connectDB();

    const otpRecord = await OtpToken.findById(tokenId);
    if (!otpRecord) {
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }
    if (otpRecord.attempts >= 5) {
      await OtpToken.findByIdAndDelete(tokenId);
      return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return NextResponse.json({ error: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
