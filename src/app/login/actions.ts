"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  try {
    // signIn with redirectTo throws a REDIRECT (not an error).
    // Next.js intercepts the redirect and navigates server-side,
    // setting the session cookie BEFORE the browser receives the response.
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // AuthError = actual auth failures (wrong credentials, etc.)
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    // Re-throw anything that is NOT an AuthError — this includes the
    // REDIRECT thrown by Next.js navigation, which must propagate up.
    throw error;
  }

  return null;
}
