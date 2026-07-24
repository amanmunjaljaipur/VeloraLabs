"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, Loader2, Sparkles, TrendingUp, XCircle, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface GrowthInsight {
  observation: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

interface GrowthAction {
  key: string;
  label: string;
  rationale: string;
}

interface GrowthExecutionResult {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface GrowthMemoryEntry {
  id: string;
  createdAt: string;
  signalsSummary: string;
  strategySummary: string;
  insights: GrowthInsight[];
  suggestedActions: GrowthAction[];
  executedActions: GrowthExecutionResult[] | null;
  triggeredBy: "manual" | "daily-cron";
}

const PRIORITY_COLORS: Record<GrowthInsight["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-muted text-text-secondary",
};

export function GrowthAdvisor() {
  const { toast } = useToast();
  const [history, setHistory] = useState<GrowthMemoryEntry[]>([]);
  const [autoGrowthEnabled, setAutoGrowthEnabled] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/marketing/growth");
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.history ?? []);
      setAutoGrowthEnabled(Boolean(data.autoGrowthEnabled));
      setConfigured(Boolean(data.configured));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const latest = history[0] ?? null;

  const handleGetStrategy = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/marketing/growth/strategy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Strategy generation failed");
      toast("Strategy ready", "success");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Strategy generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }, [load, toast]);

  const handleExecute = useCallback(async () => {
    if (!latest || latest.suggestedActions.length === 0) return;
    setExecuting(true);
    try {
      const res = await fetch("/api/admin/marketing/growth/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: latest.id, actionKeys: latest.suggestedActions.map((a) => a.key) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Execution failed");
      const okCount = (data.results as GrowthExecutionResult[]).filter((r) => r.ok).length;
      toast(`Executed - ${okCount}/${data.results.length} action(s) succeeded`, okCount > 0 ? "success" : "error");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Execution failed", "error");
    } finally {
      setExecuting(false);
    }
  }, [latest, load, toast]);

  const handleToggleAuto = useCallback(
    async (enabled: boolean) => {
      setAutoGrowthEnabled(enabled);
      try {
        const res = await fetch("/api/admin/marketing/growth", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoGrowthEnabled: enabled }),
        });
        if (!res.ok) throw new Error();
        toast(enabled ? "Daily auto-pilot enabled" : "Daily auto-pilot disabled", "success");
      } catch {
        setAutoGrowthEnabled(!enabled);
        toast("Could not update auto-pilot setting", "error");
      }
    },
    [toast]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (!configured) {
    return (
      <Card className="p-6 text-sm text-text-secondary">
        AI is not configured - set GROQ_API_KEY or GEMINI_API_KEY to enable the Growth Advisor.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <TrendingUp className="h-5 w-5 text-teal" /> AI Growth Advisor
            </p>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              One button reads everything happening across posts, leads, campaigns, and inbox, and tells you what to
              do next. A second button does it - for real, through the same tools you'd use by hand. It runs itself
              once a day and remembers what it already told you, so the advice compounds instead of repeating.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={autoGrowthEnabled}
              onChange={(e) => handleToggleAuto(e.target.checked)}
            />
            Run automatically every day
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button loading={generating} onClick={handleGetStrategy}>
            <Sparkles className="h-4 w-4" /> Get strategy
          </Button>
          {latest && latest.suggestedActions.length > 0 && !latest.executedActions && (
            <Button variant="secondary" loading={executing} onClick={handleExecute}>
              <Zap className="h-4 w-4" /> Execute now
            </Button>
          )}
        </div>
      </Card>

      {latest && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Latest strategy</p>
            <span className="text-xs text-text-secondary">
              {new Date(latest.createdAt).toLocaleString()} - {latest.triggeredBy === "daily-cron" ? "daily run" : "manual"}
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground">{latest.strategySummary}</p>

          <div className="mt-4 space-y-2">
            {latest.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/40 p-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[insight.priority]}`}>
                  {insight.priority}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{insight.observation}</p>
                  <p className="mt-0.5 text-sm text-text-secondary">→ {insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>

          {latest.suggestedActions.length > 0 && (
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Suggested actions</p>
              <ul className="mt-2 space-y-1">
                {latest.suggestedActions.map((a) => {
                  const outcome = latest.executedActions?.find((r) => r.key === a.key);
                  return (
                    <li key={a.key} className="flex items-start gap-2 text-sm">
                      {outcome ? (
                        outcome.ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                        )
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                      )}
                      <span className="text-foreground">
                        {a.label}
                        {outcome && <span className="text-text-secondary"> - {outcome.detail}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      )}

      {history.length > 1 && (
        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground">History (what it's learned so far)</p>
          <ul className="mt-3 space-y-3">
            {history.slice(1, 10).map((h) => (
              <li key={h.id} className="border-t border-border/40 pt-3 text-sm">
                <p className="text-xs text-text-secondary">
                  {new Date(h.createdAt).toLocaleDateString()} - {h.triggeredBy === "daily-cron" ? "daily run" : "manual"}
                </p>
                <p className="mt-1 text-foreground">{h.strategySummary}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
