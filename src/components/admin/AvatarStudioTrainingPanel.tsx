"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AlertTriangle, Pause, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TrainingBatch {
  id: string;
  triggeredBy: "cron" | "manual";
  triggeredByEmail: string | null;
  windowStart: string;
  windowEnd: string;
  feedbackEntryIds: string[];
  status: string;
  evaluationNotes: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface TrainingSettings {
  paused: boolean;
  pausedBy: string | null;
  pausedAt: string | null;
}

interface ModerationLogEntry {
  id: string;
  email: string;
  categoryId: string;
  moderationLevel: string;
  scriptExcerpt: string;
  approved: boolean;
  reason: string | null;
  flaggedTerms: string[];
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  running: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  passed_deployed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed_evaluation: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  skipped_insufficient_data: "bg-muted text-text-secondary",
  skipped_paused: "bg-muted text-text-secondary",
  rolled_back: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

async function parseJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

export function AvatarStudioTrainingPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TrainingSettings | null>(null);
  const [batches, setBatches] = useState<TrainingBatch[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [showOnlyRejected, setShowOnlyRejected] = useState(false);

  const load = useCallback(async () => {
    const [trainingRes, modRes] = await Promise.all([
      fetch("/api/admin/avatar-studio/training"),
      fetch("/api/admin/avatar-studio/moderation-log"),
    ]);
    const trainingData = await parseJson(trainingRes);
    const modData = await parseJson(modRes);
    if (trainingRes.ok) {
      setSettings(trainingData.settings);
      setBatches(trainingData.batches ?? []);
    }
    if (modRes.ok) setModerationLog(modData.entries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle() {
    if (!settings) return;
    setToggling(true);
    try {
      const res = await fetch("/api/admin/avatar-studio/training/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !settings.paused }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not update training status", "error");
        return;
      }
      setSettings(data.settings);
      toast(data.settings.paused ? "Training paused" : "Training resumed", "success");
    } catch {
      toast("Could not update training status", "error");
    } finally {
      setToggling(false);
    }
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      const res = await fetch("/api/admin/avatar-studio/training/trigger", { method: "POST" });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not run a training cycle", "error");
        return;
      }
      toast(`Cycle finished: ${data.batch.status}`, "success");
      void load();
    } catch {
      toast("Could not run a training cycle", "error");
    } finally {
      setTriggering(false);
    }
  }

  const visibleLog = showOnlyRejected ? moderationLog.filter((e) => !e.approved) : moderationLog;
  const consentedVolume = batches.reduce((sum, b) => sum + b.feedbackEntryIds.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-accent-teal" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Avatar Studio - Training &amp; Moderation</h1>
        <p className="text-sm text-text-secondary">Owner-controlled training loop and a view into what the Moderation Agent is screening.</p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${settings?.paused ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
            <ShieldCheck className={`h-5 w-5 ${settings?.paused ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Training is {settings?.paused ? "paused" : "active"}</p>
            <p className="text-xs text-text-secondary">
              {settings?.paused ? `Paused by ${settings.pausedBy ?? "-"} at ${settings.pausedAt ? new Date(settings.pausedAt).toLocaleString() : "-"}` : "Daily cycle runs automatically; you can also trigger one now."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" loading={toggling} onClick={handleToggle}>
            {settings?.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {settings?.paused ? "Resume training" : "Pause training"}
          </Button>
          <Button loading={triggering} onClick={handleTrigger} disabled={settings?.paused}>
            <RefreshCw className="h-4 w-4" /> Run cycle now
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-text-secondary">Total batches recorded</p>
          <p className="text-2xl font-semibold text-foreground">{batches.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Feedback entries retained across all batches</p>
          <p className="text-2xl font-semibold text-foreground">{consentedVolume}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Moderation checks logged</p>
          <p className="text-2xl font-semibold text-foreground">{moderationLog.length}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Batch history</h3>
        {batches.length === 0 ? (
          <p className="text-sm text-text-secondary">No cycles have run yet.</p>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => (
              <div key={b.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge className={STATUS_COLOR[b.status] ?? ""}>{b.status.replace(/_/g, " ")}</Badge>
                  <span className="text-xs text-text-secondary">
                    {b.triggeredBy === "manual" ? `Manually by ${b.triggeredByEmail}` : "Daily cron"} - {new Date(b.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Window {new Date(b.windowStart).toLocaleDateString()} - {new Date(b.windowEnd).toLocaleDateString()} - {b.feedbackEntryIds.length} feedback entries
                </p>
                {b.evaluationNotes && <p className="mt-1 text-sm text-foreground">{b.evaluationNotes}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Moderation queue</h3>
          <button type="button" onClick={() => setShowOnlyRejected((v) => !v)} className="text-xs font-medium text-accent-teal hover:underline">
            {showOnlyRejected ? "Show all" : "Show rejected only"}
          </button>
        </div>
        {visibleLog.length === 0 ? (
          <p className="text-sm text-text-secondary">No moderation activity yet.</p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {visibleLog.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    {!entry.approved && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                    <Badge className={entry.approved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
                      {entry.approved ? "Approved" : "Rejected"}
                    </Badge>
                    <span className="text-xs text-text-secondary">{entry.categoryId} - {entry.moderationLevel}</span>
                  </span>
                  <span className="text-xs text-text-secondary">{entry.email} - {new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-text-secondary">{entry.scriptExcerpt}</p>
                {entry.reason && <p className="mt-1 text-red-700 dark:text-red-400">{entry.reason}</p>}
                {entry.flaggedTerms.length > 0 && <p className="mt-1 text-xs text-text-secondary">Flagged: {entry.flaggedTerms.join(", ")}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
