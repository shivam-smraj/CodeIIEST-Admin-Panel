"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Code2, Loader2, ExternalLink, ShieldCheck } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  cf_denied:       "You denied access on Codeforces. Please try again.",
  nonce_missing:   "Session expired. Please try again.",
  nonce_mismatch:  "Security check failed. Please try again.",
  token_exchange:  "Failed to connect to Codeforces. Please try again.",
  no_id_token:     "Codeforces did not return a valid token.",
  no_handle:       "Could not read your Codeforces handle.",
  server_error:    "An unexpected error occurred. Please try again.",
};

function CFVerifyContent() {
  const params = useSearchParams();
  const success = params.get("success") === "true";
  const handle  = params.get("handle");
  const error   = params.get("error");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Codeforces Verification</h1>
        <p className="text-muted-foreground text-sm">
          Link your Codeforces account to appear on the CodeIIEST leaderboard
        </p>
      </div>

      {/* Success state */}
      {success && handle && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <div>
                <p className="text-lg font-bold text-white">Verified!</p>
                <p className="text-muted-foreground text-sm">
                  Your Codeforces handle <span className="text-green-400 font-semibold">{handle}</span> has been linked.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You will now appear on the CodeIIEST GDSC leaderboard.
                </p>
              </div>
              <a
                href={`https://codeforces.com/profile/${handle}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />View on Codeforces
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Verification Failed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main verify card */}
      {!success && (
        <Card className="border-border/50 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              How Verification Works
            </CardTitle>
            <CardDescription>Secure OAuth — we never see your Codeforces password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Click the button below to be redirected to Codeforces",
                "Log in to Codeforces and click \"Allow\" to share your handle",
                "You are redirected back here and your handle is saved automatically",
                "Your rating is fetched and you appear on the leaderboard within 30 seconds",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <a
              href="/api/cf/start"
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 px-4 py-2 rounded-md transition-colors text-sm"
            >
              <Code2 className="w-4 h-4" />
              Connect Codeforces Account
            </a>

            <p className="text-xs text-muted-foreground text-center">
              This uses the official Codeforces OAuth. We only read your public profile.
            </p>
          </CardContent>
        </Card>
      )}

      {success && (
        <a href="/dashboard" className="inline-flex items-center gap-1 px-4 py-2 rounded-md border border-border/60 text-sm text-muted-foreground hover:text-white hover:border-border transition-colors">← Back to Dashboard</a>
      )}
    </div>
  );
}

export default function CFVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <CFVerifyContent />
    </Suspense>
  );
}
