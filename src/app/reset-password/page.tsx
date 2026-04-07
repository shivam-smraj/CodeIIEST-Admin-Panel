"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Loader2, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get("token") ?? "";

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);

  if (!token) {
    return (
      <Card className="border-red-500/30 bg-card/80 backdrop-blur-xl">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-red-400">
            Invalid or missing reset token.{" "}
            <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 underline">
              Request a new link
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="border-green-500/30 bg-card/80 backdrop-blur-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <div>
              <p className="font-semibold text-white text-lg">Password reset!</p>
              <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Set new password</CardTitle>
        <CardDescription>Must be at least 8 characters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" placeholder="Min. 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} required
              className="bg-background/60 border-border/60 focus:border-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" placeholder="Repeat password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="bg-background/60 border-border/60 focus:border-indigo-500" />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Reset Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md px-4 py-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Code2 className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white">CodeIIEST</span>
          <span className="text-sm text-muted-foreground border border-border rounded-full px-2 py-0.5">Admin</span>
        </div>
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
