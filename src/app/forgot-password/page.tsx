"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md px-4 py-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Code2 className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CodeIIEST</span>
          <span className="text-sm text-muted-foreground border border-border rounded-full px-2 py-0.5">Admin</span>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          {!sent ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Forgot password?</CardTitle>
                <CardDescription>
                  Enter your college email and we&apos;ll send you a reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">College Email</Label>
                    <Input id="email" type="email" placeholder="you@students.iiests.ac.in"
                      value={email} onChange={e => setEmail(e.target.value)} required
                      className="bg-background/60 border-border/60 focus:border-indigo-500" />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Reset Link
                  </Button>
                  <div className="text-center">
                    <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Back to login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-indigo-600/10 border border-indigo-500/20">
                  <MailCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">Check your email</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If <span className="text-indigo-400">{email}</span> is registered,
                    you&apos;ll receive a reset link shortly. It expires in 15 minutes.
                  </p>
                </div>
                <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
