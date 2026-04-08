"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getIdToken,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Loader2, Globe } from "lucide-react";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";

export default function LoginPage() {
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Shared: exchange a fresh Firebase ID token for a server session cookie ──
  async function createSession(idToken: string): Promise<boolean> {
    const res = await fetch("/api/auth/session", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ idToken }),
    });
    return res.ok;
  }

  // ── Email / Password sign-in ──────────────────────────────────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken    = await getIdToken(credential.user, /* forceRefresh */ true);
      const ok         = await createSession(idToken);

      if (ok) {
        toast.success("Logged in successfully!");
        // Hard navigation so server components re-render with the new cookie
        window.location.href = "/dashboard";
      } else {
        toast.error("Session creation failed. Please try again.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Invalid email or password.");
      } else if (code === "auth/user-disabled") {
        toast.error("This account has been disabled.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait and try again.");
      } else {
        toast.error("Login failed. Please try again.");
        console.error("[login]", err);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Google sign-in ────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const result  = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await getIdToken(result.user, true);
      const ok      = await createSession(idToken);

      if (ok) {
        toast.success("Logged in with Google!");
        window.location.href = "/dashboard";
      } else {
        toast.error("Session creation failed. Please try again.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        toast.error("Google sign-in failed. Please try again.");
        console.error("[google-login]", err);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4 py-12">
        <div className="flex items-center justify-center gap-3 mb-8">
          <CodeiiestLogo size={40} />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight leading-none">CodeIIEST</span>
            <span className="text-xs text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 mt-1 w-fit">Admin Portal</span>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your CodeIIEST admin account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-border/70 hover:bg-accent/60 gap-2 text-sm font-medium"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-blue-400" />}
              Continue with Google (IIEST)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email / Password */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-muted-foreground">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@students.iiests.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-background/60 border-border/60 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-background/60 border-border/60 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
                disabled={loading || googleLoading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-2">
              New student?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Only IIEST Shibpur college email addresses are allowed
        </p>
      </div>
    </div>
  );
}
