"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  Flame,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface InboxEntry {
  uid: number;
  from: string;
  fromName: string | null;
  subject: string;
  snippet: string;
  bodyText: string;
  date: string;
  seen: boolean;
  tag: "lead" | "support" | "partnership" | "spam" | "other";
  priority: "high" | "normal" | "low";
  aiSummary: string | null;
  read: boolean;
  archived: boolean;
}

interface Lead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  status: "new" | "contacted" | "qualified" | "customer" | "lost";
  source: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  recipients: string[];
  includeAllLeads: boolean;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt: string | null;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface Config {
  inboxConfigured: boolean;
  sendConfigured: boolean;
  aiConfigured: boolean;
}

const TAG_LABELS: Record<InboxEntry["tag"], string> = {
  lead: "Lead",
  support: "Support",
  partnership: "Partnership",
  spam: "Spam",
  other: "Other",
};

const TAG_COLORS: Record<InboxEntry["tag"], string> = {
  lead: "bg-emerald-100 text-emerald-700",
  support: "bg-blue-100 text-blue-700",
  partnership: "bg-purple-100 text-purple-700",
  spam: "bg-red-100 text-red-700",
  other: "bg-muted text-text-secondary",
};

type Tab = "inbox" | "leads" | "campaigns";

export function EmailSuite() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("inbox");
  const [config, setConfig] = useState<Config | null>(null);
  const [entries, setEntries] = useState<InboxEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Campaign composer
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [includeAllLeads, setIncludeAllLeads] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, inboxRes, leadsRes, campaignsRes] = await Promise.all([
        fetch("/api/admin/marketing/email/config"),
        fetch("/api/admin/marketing/email/inbox"),
        fetch("/api/admin/marketing/email/leads"),
        fetch("/api/admin/marketing/email/campaigns"),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (inboxRes.ok) setEntries((await inboxRes.json()).entries ?? []);
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads ?? []);
      if (campaignsRes.ok) setCampaigns((await campaignsRes.json()).campaigns ?? []);
    } catch {
      toast("Could not load Email Suite data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/marketing/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      toast(`Synced - ${data.synced} new message(s), ${data.triaged} AI-triaged`, "success");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }, [load, toast]);

  const handleSendCampaign = useCallback(async () => {
    if (!subject.trim() || !html.trim()) {
      toast("Add a subject and body", "error");
      return;
    }
    const recipients = recipientsText
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter((r) => r.includes("@"));
    if (recipients.length === 0 && !includeAllLeads) {
      toast("Add recipients or check 'send to all leads'", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          recipients,
          includeAllLeads,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      toast(
        data.scheduled
          ? `Scheduled for ${new Date(data.campaign.scheduledAt).toLocaleString()}`
          : `Sent to ${data.result?.sentCount ?? 0} recipient(s)`,
        "success"
      );
      setSubject("");
      setHtml("");
      setRecipientsText("");
      setIncludeAllLeads(false);
      setScheduledAt("");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Send failed", "error");
    } finally {
      setSending(false);
    }
  }, [subject, html, recipientsText, includeAllLeads, scheduledAt, load, toast]);

  const handleCancelCampaign = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/admin/marketing/email/campaigns?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Cancel failed");
        toast("Campaign canceled", "success");
        await load();
      } catch {
        toast("Could not cancel campaign", "error");
      }
    },
    [load, toast]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {config && (!config.inboxConfigured || !config.sendConfigured) && (
        <Card className="flex items-start gap-4 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="text-sm text-text-secondary">
            {!config.inboxConfigured && (
              <p>
                Inbox reading is off - set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">IMAP_HOST</code>
                , <code className="rounded bg-muted px-1.5 py-0.5 text-xs">IMAP_USER</code>, and{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">IMAP_PASS</code> to connect a mailbox.
              </p>
            )}
            {!config.sendConfigured && (
              <p className="mt-1">
                Sending is off - configure SMTP or <code className="rounded bg-muted px-1.5 py-0.5 text-xs">RESEND_API_KEY</code>{" "}
                (same as the newsletter sender).
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="flex gap-2 border-b border-border/60">
        {(["inbox", "leads", "campaigns"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-foreground"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{entries.length} cached message(s)</p>
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
              <RefreshCw className="h-3.5 w-3.5" /> Sync inbox
            </Button>
          </div>
          {entries.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No messages yet. Click "Sync inbox" to pull from your connected mailbox.
            </Card>
          ) : (
            <div className="space-y-2">
              {entries
                .filter((e) => !e.archived)
                .map((entry) => (
                  <Card key={entry.uid} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{entry.fromName ?? entry.from}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAG_COLORS[entry.tag]}`}>
                            {TAG_LABELS[entry.tag]}
                          </span>
                          {entry.priority === "high" && (
                            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              <Flame className="h-3 w-3" /> High priority
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-foreground">{entry.subject}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {entry.aiSummary ? (
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> {entry.aiSummary}
                            </span>
                          ) : (
                            entry.snippet
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-text-secondary">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {leads.length} lead(s) - auto-captured from inbox triage, or add manually via the API.
          </p>
          {leads.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No leads yet. Sync your inbox and AI triage will flag anything that looks like a lead.
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border/40">
                      <td className="px-4 py-2 text-foreground">{lead.email}</td>
                      <td className="px-4 py-2 text-text-secondary">{lead.name ?? "-"}</td>
                      <td className="px-4 py-2 capitalize text-text-secondary">{lead.status}</td>
                      <td className="px-4 py-2 capitalize text-text-secondary">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-6">
          <Card className="space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4" /> New campaign
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Email body (HTML supported) - compliance footer with unsubscribe link is added automatically"
              rows={5}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              placeholder="Recipient emails - one per line or comma-separated"
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={includeAllLeads}
                onChange={(e) => setIncludeAllLeads(e.target.checked)}
              />
              <Users className="h-3.5 w-3.5" /> Also send to all captured leads
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
              <Button size="sm" loading={sending} onClick={handleSendCampaign}>
                <Send className="h-3.5 w-3.5" /> {scheduledAt ? "Schedule" : "Send now"}
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            {campaigns.map((c) => (
              <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.subject}</p>
                  <p className="text-xs text-text-secondary">
                    {c.status === "sent"
                      ? `Sent - ${c.sentCount} delivered, ${c.failedCount} failed`
                      : c.status === "scheduled"
                        ? `Scheduled for ${new Date(c.scheduledAt!).toLocaleString()}`
                        : c.status}
                  </p>
                </div>
                {c.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => handleCancelCampaign(c.id)}
                    className="shrink-0 text-text-secondary hover:text-red-600"
                    aria-label="Cancel campaign"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
