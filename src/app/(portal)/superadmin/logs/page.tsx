"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ScrollText, Search, Clock, ArrowRight } from "lucide-react";

interface AuditLog {
  _id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  ipAddress?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-400 border-green-500/30",
  UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
};

function getActionBadgeStyle(action: string) {
  for (const [key, val] of Object.entries(actionColors)) {
    if (action.includes(key)) return val;
  }
  return "bg-muted/50 text-muted-foreground border-border/50";
}

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/logs");
      if (res.ok) {
        setLogs(await res.json());
      } else {
        toast.error("Failed to load logs");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) =>
    `${log.actorEmail} ${log.action} ${log.targetName} ${log.targetType}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-indigo-400" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            Recent administrative actions
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/60 border-border/60"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="border-border/50 bg-card/60">
            <CardContent className="text-center p-12 text-muted-foreground">
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No audit logs found matching &quot;{search}&quot;</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  {/* Left info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-white">{log.targetName}</span>
                      <span className="text-xs text-muted-foreground">({log.targetType})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by <span className="text-indigo-400">{log.actorEmail}</span>
                    </div>
                  </div>

                  {/* Right info */}
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                    {log.ipAddress && (
                      <div className="text-[10px] text-muted-foreground/60">{log.ipAddress}</div>
                    )}
                  </div>
                </div>

                {/* Changes diff if available */}
                {Object.keys(log.changes || {}).length > 0 && (
                  <div className="mt-4 p-3 bg-background/40 rounded-md border border-border/40 text-xs overflow-x-auto">
                    <table className="w-full text-left">
                      <tbody>
                        {Object.entries(log.changes).map(([key, change]) => (
                          <tr key={key} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                            <td className="py-1.5 pr-4 font-mono text-muted-foreground font-medium">{key}</td>
                            <td className="py-1.5 pr-2 font-mono text-muted-foreground line-through">
                              {JSON.stringify(change.from) ?? "null"}
                            </td>
                            <td className="py-1.5 w-6 text-center text-muted-foreground">
                              <ArrowRight className="w-3 h-3 inline" />
                            </td>
                            <td className="py-1.5 pl-2 font-mono text-green-400 font-medium">
                              {JSON.stringify(change.to) ?? "null"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
