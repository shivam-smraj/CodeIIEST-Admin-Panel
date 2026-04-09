"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ScrollText, Search, Clock, ArrowRight, FilterX } from "lucide-react";

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

const EVENTS = [
  "CREATE_EVENT", "UPDATE_EVENT", "DELETE_EVENT",
  "CREATE_TEAM_MEMBER", "UPDATE_TEAM_MEMBER", "DELETE_TEAM_MEMBER",
  "CREATE_CHAPTER", "UPDATE_CHAPTER", "DELETE_CHAPTER",
  "PROMOTE_USER", "DEMOTE_USER", "DELETE_USER", "UPDATE_USER_ROLE"
];

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchEmail, setSearchEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchEmail) params.append("email", searchEmail);
      if (actionFilter && actionFilter !== "ALL") params.append("action", actionFilter);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);

      const res = await fetch("/api/superadmin/logs?" + params.toString());       
      if (res.ok) {
        setLogs(await res.json());
      } else {
        toast.error("Failed to load logs");
      }
    } finally {
      setLoading(false);
    }
  }, [searchEmail, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setSearchEmail("");
    setActionFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-indigo-400" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            Track and filter administrative actions natively
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 rounded-xl">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">User Email</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="actor@students..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-8 bg-background/60 border-border/60 h-9 text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Action Type</label>
            <Select value={actionFilter} onValueChange={(val: string | null) => setActionFilter(val || "ALL")}>       
              <SelectTrigger className="h-9 bg-background/60 border-border/60">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">From Date</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 bg-background/60 border-border/60 text-sm w-full [color-scheme:dark]" />
          </div>

          <div className="space-y-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">To Date</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 bg-background/60 border-border/60 text-sm w-full [color-scheme:dark]" />
          </div>

          <div className="lg:col-span-1 flex gap-2 h-9">
             <Button variant="outline" onClick={clearFilters} className="w-full text-xs" title="Clear Filters">
               <FilterX className="w-4 h-4 mr-2" /> Clear
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />  
          </div>
        ) : logs.length === 0 ? (
          <Card className="border-border/50 bg-card/60">
            <CardContent className="text-center p-12 text-muted-foreground">    
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-20" />      
              <p>No audit logs found matching filters</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log._id} className="border-border/50 bg-card/60 relative overflow-hidden group">        
              <CardContent className="p-4 relative">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
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
