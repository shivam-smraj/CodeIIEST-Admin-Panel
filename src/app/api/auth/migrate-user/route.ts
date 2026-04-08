import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/migrate-user
 *
 * Called when Firebase says "user-not-found" during email/password login.
 * Verifies the password against the MongoDB bcrypt hash, then creates a
 * Firebase Auth account so future logins go through Firebase.
 */
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    await connectDB();

    // Look up MongoDB user
    const dbUser = await User.findOne({ email }).select("+passwordHash");
    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json(
        { error: "No account found with this email. Please register first." },
        { status: 404 }
      );
    }

    // Verify the password against the stored bcrypt hash
    const isValid = await bcrypt.compare(body.password, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    // Create the Firebase Auth account (migration)
    try {
      await adminAuth.createUser({
        email,
        password:      body.password,
        displayName:   dbUser.displayName ?? undefined,
        emailVerified: true,
      });
    } catch (fbErr: unknown) {
      const code = (fbErr as { code?: string })?.code;
      if (code !== "auth/email-already-exists") {
        console.error("[migrate-user] Firebase createUser failed:", fbErr);
        return NextResponse.json(
          { error: "Account migration failed. Please contact support." },
          { status: 500 }
        );
      }
      // User already exists in Firebase — that's fine
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("[migrate-user]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
