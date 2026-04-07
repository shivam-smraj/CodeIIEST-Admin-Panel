"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  enrollmentNo?: string;
  enrollmentYear?: number;
  image?: string;
  codeforcesId?: string;
}

const roleColors: Record<string, string> = {
  user:       "border-border text-muted-foreground",
  admin:      "border-blue-500/40 text-blue-400",
  superadmin: "border-indigo-500/40 text-indigo-400",
  alumni:     "border-amber-500/40 text-amber-400",
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update role");
        return;
      }
      toast.success("User role updated successfully");
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter((u) =>
    `${u.displayName} ${u.email} ${u.enrollmentNo ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/60 border-border/60"
          />
        </div>
      </div>

      <Card className="border-border/50 bg-card/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No users found matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Contact</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Details</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border">
                            <AvatarImage src={u.image} />
                            <AvatarFallback className="bg-indigo-600/20 text-indigo-300 font-bold">
                              {u.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-muted-foreground block sm:hidden truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-muted-foreground truncate max-w-[200px]">
                          {u.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${roleColors[u.role]}`}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs text-muted-foreground">
                          {u.enrollmentNo ? <div>Roll: {u.enrollmentNo}</div> : null}
                          {u.codeforcesId ? <div className="text-indigo-400">CF: {u.codeforcesId}</div> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <Select
                            disabled={updating === u._id}
                            value={u.role}
                            onValueChange={(val: string | null) => { if (val) handleRoleChange(u._id, val); }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs bg-background/60 border-border/60">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="alumni">Alumni</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="superadmin">Superadmin</SelectItem>
                            </SelectContent>
                          </Select>
                          {updating === u._id && (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
