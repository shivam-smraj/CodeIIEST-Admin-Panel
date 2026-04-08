"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Globe } from "lucide-react";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
      disabled={pending}
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show toast on error
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
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
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-border/70 hover:bg-accent/60 gap-2 text-sm font-medium"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
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

            {/* Server Action Form — cookie is set server-side before redirect */}
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-muted-foreground">College Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@students.iiests.ac.in"
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
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-background/60 border-border/60 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-red-400 text-center">{state.error}</p>
              )}

              <SubmitButton />
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
