"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type Step = "email" | "otp" | "details";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]     = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail]   = useState("");

  // Step 2
  const [tokenId, setTokenId] = useState("");
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3
  const [displayName, setDisplayName]       = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [enrollmentNo, setEnrollmentNo]     = useState("");

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setTokenId(data.tokenId);
      setStep("otp");
      toast.success("OTP sent! Check your college email.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ────────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { toast.error("Enter the full 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setStep("details");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Complete Registration ────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          otp: otp.join(""),
          displayName,
          password,
          enrollmentYear: parseInt(enrollmentYear),
          enrollmentNo: enrollmentNo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      toast.success("Account created! Signing you in...");
      // Auto sign-in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Code2 className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CodeIIEST</span>
          <Badge variant="outline" className="text-xs border-indigo-500/40 text-indigo-400">Admin</Badge>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${n < stepNumber ? "bg-indigo-600 text-white" : n === stepNumber ? "bg-indigo-600 text-white ring-2 ring-indigo-400/40" : "bg-muted text-muted-foreground"}`}>
                {n < stepNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
              </div>
              {n < 3 && <div className={`h-px w-8 transition-all duration-300 ${n < stepNumber ? "bg-indigo-600" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          {/* ─── Step 1: Email ─────────────────────────────────────────── */}
          {step === "email" && (
            <>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Create account</CardTitle>
                <CardDescription>Enter your IIEST college email to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">College Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@students.iiests.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/60 border-border/60 focus:border-indigo-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only @students.iiests.ac.in or *.iiests.ac.in addresses accepted
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send OTP
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already registered?{" "}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
                  </p>
                </form>
              </CardContent>
            </>
          )}

          {/* ─── Step 2: OTP ───────────────────────────────────────────── */}
          {step === "otp" && (
            <>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Verify your email</CardTitle>
                <CardDescription>
                  Enter the 6-digit OTP sent to <span className="text-indigo-400">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Grid */}
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-border/60 bg-background/60 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    ))}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify OTP
                  </Button>
                  <div className="flex justify-between text-sm">
                    <button type="button" onClick={() => setStep("email")} className="text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* ─── Step 3: Details ─────────────────────────────────────── */}
          {step === "details" && (
            <>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Complete your profile</CardTitle>
                <CardDescription>Just a few more details to set up your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input id="displayName" placeholder="Shivam Kumar" value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)} required
                      className="bg-background/60 border-border/60 focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="enrollYear">Enrollment Year</Label>
                      <Input id="enrollYear" type="number" placeholder="2023"
                        value={enrollmentYear} onChange={(e) => setEnrollmentYear(e.target.value)}
                        required min={2015} max={new Date().getFullYear()}
                        className="bg-background/60 border-border/60 focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="enrollNo">Roll No. <span className="text-muted-foreground">(optional)</span></Label>
                      <Input id="enrollNo" placeholder="2024EEB109"
                        value={enrollmentNo} onChange={(e) => setEnrollmentNo(e.target.value)}
                        className="bg-background/60 border-border/60 focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Min. 8 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="bg-background/60 border-border/60 focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Repeat password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      className="bg-background/60 border-border/60 focus:border-indigo-500" />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 mt-2"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
