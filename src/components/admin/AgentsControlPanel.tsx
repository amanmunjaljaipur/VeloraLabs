"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Loader2, Pause, Play, RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AgentRow = {
  id: string;
  name: string;
  area: string;
  kind: string;
  description: string;
  surfaces: string[];
  routes: string[];
  pausableRuntime: boolean;
  paused: boolean;
  status: "active" | "paused";
  pausedAt?: string;
  pausedBy?: string;
  note?: string;
};

export function AgentsControlPanel() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, runtime: 0, paused: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/agents");
    if (!res.ok) {
      toast("Could not load agents", "error");
      return;
    }
    const data = (await res.json()) as {
      agents: AgentRow[];
      summary: typeof summary;
    };
    setAgents(data.agents || []);
    if (data.summary) setSummary(data.summary);
  }, [toast]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function setPaused(agentId: string, paused: boolean) {
    setBusyId(agentId);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, paused }),
      });
      const data = (await res.json()) as { error?: string; agent?: AgentRow };
      if (!res.ok) {
        toast(data.error || "Update failed", "error");
        return;
      }
      toast(paused ? "Agent paused" : "Agent resumed", "success");
      await load();
    } catch {
      toast("Network error", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function bulk(action: "pause_all_runtime" | "resume_all") {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast("Bulk action failed", "error");
        return;
      }
      toast(action === "pause_all_runtime" ? "All runtime agents paused" : "All agents resumed", "success");
      await load();
    } catch {
      toast("Network error", "error");
    } finally {
      setBulkBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading agents…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="h-6 w-6 text-accent-teal" />
            Agents
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Every AI / product agent used across Verlin Labs and App Builder. Super Admin can pause
            runtime agents anytime - public chat, App Builder generate, blog, newsletter, and more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={bulkBusy}
            onClick={() => void bulk("pause_all_runtime")}
          >
            <Pause className="mr-1.5 h-3.5 w-3.5" />
            Pause all runtime
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={bulkBusy}
            onClick={() => void bulk("resume_all")}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Resume all
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Total", summary.total],
          ["Runtime", summary.runtime],
          ["Active", summary.active],
          ["Paused", summary.paused],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Where used</th>
                <th className="px-4 py-3 font-semibold">Control</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-border/80 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{a.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-text-muted">{a.id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{a.area}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] capitalize">
                      {a.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        a.paused
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      )}
                    >
                      {a.status}
                    </span>
                    {a.paused && a.pausedBy ? (
                      <p className="mt-1 text-[10px] text-text-muted">
                        by {a.pausedBy}
                        {a.pausedAt ? ` · ${new Date(a.pausedAt).toLocaleString()}` : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <ul className="list-inside list-disc space-y-0.5">
                      {a.surfaces.slice(0, 3).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    {a.pausableRuntime ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={a.paused ? "primary" : "secondary"}
                        disabled={busyId === a.id}
                        loading={busyId === a.id}
                        onClick={() => void setPaused(a.id, !a.paused)}
                      >
                        {a.paused ? (
                          <>
                            <Play className="mr-1 h-3.5 w-3.5" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="mr-1 h-3.5 w-3.5" />
                            Pause
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-[11px] text-text-muted" title="Design-time skill only">
                        Design skill
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-text-muted">
        Pause state is stored in deploy-safe runtime data (Blob). It survives code deploys. Design
        skills are listed for inventory; only runtime agents block API calls when paused.
      </p>
    </div>
  );
}
