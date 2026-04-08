import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Code2, GitBranch, Trophy, GraduationCap,
  User as UserIcon, Hash, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function currentCollegeYear(enrollmentYear?: number): string {
  if (!enrollmentYear) return "—";
  const y = new Date().getFullYear() - enrollmentYear + 1;
  if (y < 1 || y > 5) return "Alumni";
  return `Year ${y}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const user = await User.findOne({ email: session.email }).lean();
  if (!user) return null;

  const roleColors: Record<string, string> = {
    user:       "border-border text-muted-foreground",
    admin:      "border-blue-500/40 text-blue-400",
    superadmin: "border-indigo-500/40 text-indigo-400",
    alumni:     "border-amber-500/40 text-amber-400",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user.displayName}</p>
      </div>

      {/* Profile overview card */}
      <Card className="border-border/50 bg-card/60">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-indigo-500/30">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-indigo-600/20 text-indigo-300 text-2xl font-bold">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                <Badge variant="outline" className={`text-xs ${roleColors[user.role]}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                {user.enrollmentNo && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{user.enrollmentNo}</span>
                )}
                {user.enrollmentYear && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />{currentCollegeYear(user.enrollmentYear)}
                  </span>
                )}
              </div>
            </div>
            <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/60")}>
              Edit Profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CF Status Card */}
        <Card className={`border-border/50 bg-card/60 ${user.codeforcesId ? "border-green-500/20" : "border-orange-500/20"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Codeforces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.codeforcesId ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-white text-sm">{user.codeforcesId}</span>
                </div>
                {user.codeforcesRating && (
                  <p className="text-2xl font-bold text-white">{user.codeforcesRating}
                    <span className="text-sm font-normal text-muted-foreground ml-1">rating</span>
                  </p>
                )}
                <a href={`https://codeforces.com/profile/${user.codeforcesId}`} target="_blank" rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />View CF Profile
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-muted-foreground">Not verified</span>
                </div>
                <Link href="/cf-verify" className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7")}>
                  Verify Now
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> GitHub
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.githubId ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <a href={`https://github.com/${user.githubId}`} target="_blank" rel="noreferrer"
                  className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors">
                  @{user.githubId}
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Not set</span>
                </div>
                <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 border-border/60")}>
                  Add GitHub
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const fields = [user.enrollmentNo, user.enrollmentYear, user.codeforcesId, user.githubId];
              const filled = fields.filter(Boolean).length;
              const pct = Math.round((filled / fields.length) * 100);
              return (
                <>
                  <p className="text-2xl font-bold text-white">{pct}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span></p>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{filled}/{fields.length} fields complete</p>
                  {pct < 100 && (
                    <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 border-border/60 mt-2")}>
                      Complete Profile
                    </Link>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Quick tip if CF not verified */}
      {!user.codeforcesId && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Appear on the Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verify your Codeforces handle to appear on the CodeIIEST GDSC leaderboard. Your rating will update automatically.
                </p>
                <Link href="/cf-verify" className="inline-flex items-center mt-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white transition-colors">
                  Verify CF Handle →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
