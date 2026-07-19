"use client";

import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { CrmDashboardData } from "@/lib/crm/service";
import type { CrmLead, CrmSource, CrmStage } from "@/lib/crm/types";
import { CRM_SOURCES, CRM_SOURCE_LABELS, CRM_STAGES, CRM_STAGE_LABELS } from "@/lib/crm/types";
import {
  CalendarClock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { formatSiteDateTime } from "@/lib/format-datetime";
import { useCallback, useEffect, useMemo, useState } from "react";

type LeadDetail = {
  lead: CrmLead;
  activities: Array<{ id: string; type: string; body: string; createdAt: string; createdBy: string }>;
  followUps: Array<{ id: string; dueAt: string; reason: string; status: string }>;
};

export function CrmDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<CrmStage | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLead, setNewLead] = useState<{ name: string; email: string; phone: string; source: CrmSource; notes: string }>({
    name: "",
    email: "",
    phone: "",
    source: "manual",
    notes: "",
  });
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState({ dueAt: "", reason: "" });

  const loadDashboard = useCallback(async () => {
    const res = await fetch("/api/admin/crm");
    if (!res.ok) throw new Error("Failed to load CRM");
    return (await res.json()) as CrmDashboardData;
  }, []);

  const syncAndLoadDashboard = useCallback(async () => {
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    if (!res.ok) throw new Error("Failed to sync CRM");
    return (await res.json()) as CrmDashboardData;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      try {
        const cached = await loadDashboard();
        if (!cancelled) setData(cached);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      setSyncing(true);
      try {
        const fresh = await syncAndLoadDashboard();
        if (!cancelled) setData(fresh);
      } catch {
        // Keep cached dashboard visible if background sync fails.
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, syncAndLoadDashboard]);

  const loadDetail = useCallback(async (leadId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/crm/${encodeURIComponent(leadId)}`);
      const payload = (await res.json()) as LeadDetail & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Could not load lead details");
      }
      setDetail(payload);
    } catch (error) {
      setDetail(null);
      setDetailError(error instanceof Error ? error.message : "Could not load lead details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setDetailError(null);
    }
  }, [selectedId, loadDetail]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.leads.filter((lead) => {
      if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.notes.toLowerCase().includes(q)
      );
    });
  }, [data, query, stageFilter]);

  async function handleSync() {
    setSyncing(true);
    try {
      const dashboard = await syncAndLoadDashboard();
      setData(dashboard);
      if (selectedId) await loadDetail(selectedId);
    } catch {
      toast("Background sync failed. Showing the latest saved CRM data.", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const payload = (await res.json()) as {
        lead?: CrmLead;
        dashboard?: CrmDashboardData;
        error?: string;
      };
      if (res.ok) {
        setData(payload.dashboard ?? (await loadDashboard()));
        setSelectedId(payload.lead?.id ?? null);
        setShowAdd(false);
        setNewLead({ name: "", email: "", phone: "", source: "manual", notes: "" });
      } else {
        throw new Error(payload.error || "Failed to create lead");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to create lead", "error");
    } finally {
      setSaving(false);
    }
  }

  async function patchLead(patch: Record<string, unknown>) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/crm/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const payload = await res.json();
        setDetail(payload.detail as LeadDetail);
        setData(await loadDashboard());
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!selectedId || !note.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/${selectedId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note.trim() }),
      });
      setNote("");
      await loadDetail(selectedId);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFollowUp() {
    if (!selectedId || !followUp.dueAt || !followUp.reason.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/${selectedId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUp),
      });
      setFollowUp({ dueAt: "", reason: "" });
      await loadDetail(selectedId);
      setData(await loadDashboard());
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!selectedId || !confirm("Archive this lead?")) return;
    await fetch(`/api/admin/crm/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setData(await loadDashboard());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {syncing ? "Syncing sources and loading CRM…" : "Loading CRM…"}
      </div>
    );
  }

  if (!data) {
    return <p className="py-12 text-center text-text-secondary">Unable to load CRM.</p>;
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">CRM</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
            Verlin Labs lead pipeline - free sessions, inquiries, newsletter signups, and learners.
            Sources sync automatically when you open this page. Edit stages, notes, and follow-ups anytime.
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            {syncing
              ? "Syncing sources…"
              : data.lastSyncedAt
                ? `Last synced ${formatSiteDateTime(data.lastSyncedAt)}`
                : "Sources not synced yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            Sync sources
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal"
          >
            <UserPlus className="h-4 w-4" />
            Add lead
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total leads", value: data.stats.total },
          { label: "Follow-ups due", value: data.stats.dueToday },
          { label: "Pending follow-ups", value: data.stats.pendingFollowUps },
          { label: "Session booked", value: data.stats.byStage.session_booked },
          { label: "Enrolled", value: data.stats.byStage.enrolled },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-text-secondary">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStageFilter("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            stageFilter === "all" ? "bg-accent-teal/10 text-accent-teal" : "bg-muted text-text-secondary"
          )}
        >
          All
        </button>
        {CRM_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStageFilter(stage)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              stageFilter === stage ? "bg-accent-teal/10 text-accent-teal" : "bg-muted text-text-secondary"
            )}
          >
            {CRM_STAGE_LABELS[stage]} ({data.stats.byStage[stage]})
          </button>
        ))}
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-text-secondary">
                  <tr>
                    {["Name", "Email", "Stage", "Source", "Session", "Updated"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/40",
                        selectedId === lead.id && "bg-accent-teal/5"
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{lead.name || " - "}</td>
                      <td className="px-4 py-3">{lead.email}</td>
                      <td className="px-4 py-3">{CRM_STAGE_LABELS[lead.stage]}</td>
                      <td className="px-4 py-3">{CRM_SOURCE_LABELS[lead.source]}</td>
                      <td className="px-4 py-3">{lead.sessionDate ? `${lead.sessionDate} ${lead.sessionTime}` : " - "}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatStamp(lead.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <p className="py-10 text-center text-sm text-text-secondary">
                  No leads yet. Sources sync automatically when you open CRM - use <strong>Sync sources</strong> to refresh.
                </p>
              )}
            </div>
          </Card>
        </div>

        <Card className="sticky top-24 h-fit p-4">
          {!selectedId ? (
            <p className="py-8 text-center text-sm text-text-secondary">Select a lead to view and edit details.</p>
          ) : detailLoading ? (
            <div className="flex items-center justify-center py-12 text-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : detailError ? (
            <div className="py-8 text-center text-sm text-red-600">
              <p>{detailError}</p>
              <button
                type="button"
                onClick={() => selectedId && void loadDetail(selectedId)}
                className="mt-3 text-teal hover:underline"
              >
                Try again
              </button>
            </div>
          ) : !detail ? (
            <p className="py-8 text-center text-sm text-text-secondary">Lead details unavailable.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{detail.lead.name || detail.lead.email}</h2>
                  <p className="text-sm text-text-secondary">{detail.lead.email}</p>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="block text-xs font-medium text-text-secondary">
                Stage
                <select
                  value={detail.lead.stage}
                  onChange={(e) => void patchLead({ stage: e.target.value })}
                  disabled={saving}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {CRM_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{CRM_STAGE_LABELS[stage]}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-text-secondary">
                Notes
                <textarea
                  defaultValue={detail.lead.notes}
                  onBlur={(e) => {
                    if (e.target.value !== detail.lead.notes) void patchLead({ notes: e.target.value });
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-xs font-medium text-text-secondary">
                Assigned to
                <input
                  defaultValue={detail.lead.assignedTo}
                  onBlur={(e) => {
                    if (e.target.value !== detail.lead.assignedTo) void patchLead({ assignedTo: e.target.value });
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Add note</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleAddNote()}
                  disabled={saving || !note.trim()}
                  className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  Save note
                </button>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <CalendarClock className="h-3.5 w-3.5" /> Follow-up
                </p>
                <input
                  type="datetime-local"
                  value={followUp.dueAt}
                  onChange={(e) => setFollowUp((v) => ({ ...v, dueAt: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={followUp.reason}
                  onChange={(e) => setFollowUp((v) => ({ ...v, reason: e.target.value }))}
                  placeholder="Reason"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleAddFollowUp()}
                  disabled={saving}
                  className="rounded-lg bg-accent-teal/10 px-3 py-1.5 text-xs font-medium text-accent-teal"
                >
                  Schedule follow-up
                </button>
              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Timeline</p>
                {detail.activities.slice(0, 12).map((item) => (
                  <div key={item.id} className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                    <p className="text-foreground">{item.body}</p>
                    <p className="mt-1 text-text-secondary">{formatStamp(item.createdAt)} · {item.type}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleArchive()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Archive lead
              </button>
            </div>
          )}
        </Card>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add lead</h2>
              <button type="button" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => void handleCreateLead(e)} className="space-y-3">
              <input required value={newLead.name} onChange={(e) => setNewLead((v) => ({ ...v, name: e.target.value }))} placeholder="Name" className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
              <input required type="email" value={newLead.email} onChange={(e) => setNewLead((v) => ({ ...v, email: e.target.value }))} placeholder="Email" className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
              <input value={newLead.phone} onChange={(e) => setNewLead((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone" className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
              <select value={newLead.source} onChange={(e) => setNewLead((v) => ({ ...v, source: e.target.value as CrmSource }))} className="w-full rounded-xl border border-border px-3 py-2 text-sm">
                {CRM_SOURCES.map((source) => (
                  <option key={source} value={source}>{CRM_SOURCE_LABELS[source]}</option>
                ))}
              </select>
              <textarea value={newLead.notes} onChange={(e) => setNewLead((v) => ({ ...v, notes: e.target.value }))} placeholder="Notes" rows={3} className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-teal py-2.5 text-sm font-medium text-white disabled:opacity-50">
                <Plus className="h-4 w-4" /> Create lead
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function formatStamp(value: string) {
  return formatSiteDateTime(value);
}