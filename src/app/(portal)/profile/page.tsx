"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";

interface ProfileData {
  displayName: string;
  enrollmentNo: string;
  enrollmentYear: string;
  githubId: string;
  leetcodeId: string;
  codechefId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm]         = useState<ProfileData>({
    displayName: "", enrollmentNo: "", enrollmentYear: "",
    githubId: "", leetcodeId: "", codechefId: "",
  });

  useEffect(() => {
    fetch("/api/users/me")
      .then(r => r.json())
      .then(data => {
        setForm({
          displayName:    data.displayName ?? "",
          enrollmentNo:   data.enrollmentNo ?? "",
          enrollmentYear: data.enrollmentYear?.toString() ?? "",
          githubId:       data.githubId ?? "",
          leetcodeId:     data.leetcodeId ?? "",
          codechefId:     data.codechefId ?? "",
        });
      })
      .finally(() => setFetching(false));
  }, []);

  function handleChange(key: keyof ProfileData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          enrollmentYear: form.enrollmentYear ? parseInt(form.enrollmentYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Update failed"); return; }
      toast.success("Profile updated successfully!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-muted-foreground text-sm">Update your personal details and platform handles</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
            <CardDescription>Your basic information shown on the leaderboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full Name" id="displayName" placeholder="Shivam Kumar"
              value={form.displayName} onChange={v => handleChange("displayName", v)} required />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="enrollmentNo" className="text-sm text-muted-foreground">Roll Number</Label>
                <Input id="enrollmentNo" value={form.enrollmentNo} disabled className="bg-background/30 border-border/40 text-muted-foreground cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="enrollmentYear" className="text-sm text-muted-foreground">
                  Batch Year
                </Label>
                <Input id="enrollmentYear" type="text" value={form.enrollmentYear} disabled className="bg-background/30 border-border/40 text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Handles */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Platform Handles</CardTitle>
            <CardDescription>Your competitive programming profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-sm text-muted-foreground w-24 shrink-0">Codeforces</span>
              <span className="text-sm text-indigo-400">
                Use the <a href="/cf-verify" className="underline hover:text-indigo-300">CF Verify</a> page to set your handle securely
              </span>
            </div>
            <Separator className="border-border/40" />
            <Field label="GitHub Username" id="githubId" placeholder="shivam-smraj"
              value={form.githubId} onChange={v => handleChange("githubId", v)} prefix="github.com/" />
            <Field label="LeetCode Username" id="leetcodeId" placeholder="shivam123"
              value={form.leetcodeId} onChange={v => handleChange("leetcodeId", v)} prefix="leetcode.com/u/" />
            <Field label="CodeChef Username" id="codechefId" placeholder="shivam_cc"
              value={form.codechefId} onChange={v => handleChange("codechefId", v)} prefix="codechef.com/" />
          </CardContent>
        </Card>

        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}

function Field({
  label, id, placeholder, value, onChange, required, prefix,
}: {
  label: string; id: string; placeholder?: string; value: string;
  onChange: (v: string) => void; required?: boolean; prefix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-0">
        {prefix && (
          <span className="px-3 h-9 flex items-center text-xs text-muted-foreground bg-muted/50 border border-r-0 border-border/60 rounded-l-md shrink-0">
            {prefix}
          </span>
        )}
        <Input id={id} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} required={required}
          className={`bg-background/60 border-border/60 focus:border-indigo-500 ${prefix ? "rounded-l-none" : ""}`} />
      </div>
    </div>
  );
}
