"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";

export function isCollegeEmail(email: string): boolean {
  return (
    email.endsWith("@students.iiests.ac.in") ||
    email.endsWith(".iiests.ac.in")
  );
}

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
      console.error("[google-login]", err);
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
            <CardTitle className="text-2xl font-bold text-white text-center">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Sign in to your CodeIIEST admin account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              className="w-full bg-[#131314] hover:bg-[#2b2b2b] text-[#e3e3e3] border border-[#8e918f] h-12 text-[15px] font-medium shadow-sm transition-colors rounded-md flex items-center justify-center"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Only IIEST Shibpur college email addresses are allowed
        </p>
      </div>
    </div>
  );
}
