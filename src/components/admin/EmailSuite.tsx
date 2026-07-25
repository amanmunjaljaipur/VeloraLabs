"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Image as ImageIcon,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Unlink,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface InboxEntry {
  id: string;
  mailboxId: string;
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

interface PublicMailbox {
  id: string;
  email: string;
  displayName: string;
  color: string;
  usesCustomSmtp: boolean;
  status: "connected" | "error";
  lastError: string | null;
  lastSyncedAt: string | null;
}

const LEGACY_MAILBOX_ID = "legacy-env";

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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  imageUrl: string | null;
  generatedByAi: boolean;
  createdAt: string;
}

interface Prospect {
  id: string;
  name: string | null;
  title: string | null;
  company: string;
  domain: string | null;
  guessedEmails: string[];
  rationale: string;
  status: "suggested" | "confirmed" | "promoted" | "rejected";
  sourcePrompt: string;
  createdAt: string;
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

type Tab = "inbox" | "leads" | "prospects" | "templates" | "campaigns";

const EMPTY_MAILBOX_FORM = {
  email: "",
  displayName: "",
  imapHost: "",
  imapPort: "993",
  imapSecure: true,
  imapUser: "",
  imapPass: "",
  useCustomSmtp: false,
  smtpHost: "",
  smtpPort: "465",
  smtpSecure: true,
  smtpUser: "",
  smtpPass: "",
};

export function EmailSuite() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const [tab, setTab] = useState<Tab>("inbox");
  const [config, setConfig] = useState<Config | null>(null);
  const [entries, setEntries] = useState<InboxEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Multi-mailbox login - connect/switch between several inboxes, Gmail-style
  const [mailboxes, setMailboxes] = useState<PublicMailbox[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>("all");
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [mailboxForm, setMailboxForm] = useState(EMPTY_MAILBOX_FORM);
  const [connectingMailbox, setConnectingMailbox] = useState(false);
  const [removingMailboxId, setRemovingMailboxId] = useState<string | null>(null);

  // Campaign composer
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [includeAllLeads, setIncludeAllLeads] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);

  // AI cold-email compose
  const [aiComposePrompt, setAiComposePrompt] = useState("");
  const [aiComposing, setAiComposing] = useState(false);

  // AI template generator
  const [templatePrompt, setTemplatePrompt] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateIncludeImage, setTemplateIncludeImage] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState<{ subject: string; html: string; imageUrl: string | null } | null>(
    null
  );

  // AI prospect finder
  const [prospectPrompt, setProspectPrompt] = useState("");
  const [findingProspects, setFindingProspects] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, inboxRes, leadsRes, campaignsRes, templatesRes, prospectsRes, mailboxesRes] = await Promise.all([
        fetch("/api/admin/marketing/email/config"),
        fetch("/api/admin/marketing/email/inbox"),
        fetch("/api/admin/marketing/email/leads"),
        fetch("/api/admin/marketing/email/campaigns"),
        fetch("/api/admin/marketing/email/templates"),
        fetch("/api/admin/marketing/email/prospects"),
        fetch("/api/admin/marketing/email/mailboxes"),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (inboxRes.ok) setEntries((await inboxRes.json()).entries ?? []);
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads ?? []);
      if (campaignsRes.ok) setCampaigns((await campaignsRes.json()).campaigns ?? []);
      if (templatesRes.ok) setTemplates((await templatesRes.json()).templates ?? []);
      if (prospectsRes.ok) setProspects((await prospectsRes.json()).prospects ?? []);
      if (mailboxesRes.ok) setMailboxes((await mailboxesRes.json()).mailboxes ?? []);
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

  const handleAddMailbox = useCallback(async () => {
    if (!mailboxForm.email.includes("@") || !mailboxForm.imapHost || !mailboxForm.imapUser || !mailboxForm.imapPass) {
      toast("Email, IMAP host, username, and password are required", "error");
      return;
    }
    setConnectingMailbox(true);
    try {
      const res = await fetch("/api/admin/marketing/email/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mailboxForm.email,
          displayName: mailboxForm.displayName,
          imapHost: mailboxForm.imapHost,
          imapPort: Number(mailboxForm.imapPort) || 993,
          imapSecure: mailboxForm.imapSecure,
          imapUser: mailboxForm.imapUser,
          imapPass: mailboxForm.imapPass,
          useCustomSmtp: mailboxForm.useCustomSmtp,
          smtpHost: mailboxForm.smtpHost,
          smtpPort: Number(mailboxForm.smtpPort) || 465,
          smtpSecure: mailboxForm.smtpSecure,
          smtpUser: mailboxForm.smtpUser,
          smtpPass: mailboxForm.smtpPass,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not connect that mailbox");
      toast(`Connected ${mailboxForm.email}`, "success");
      setMailboxForm(EMPTY_MAILBOX_FORM);
      setShowAddMailbox(false);
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not connect that mailbox", "error");
    } finally {
      setConnectingMailbox(false);
    }
  }, [mailboxForm, load, toast]);

  const handleRemoveMailbox = useCallback(
    async (id: string) => {
      setRemovingMailboxId(id);
      try {
        const res = await fetch(`/api/admin/marketing/email/mailboxes?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        if (selectedMailboxId === id) setSelectedMailboxId("all");
        toast("Mailbox removed", "success");
        await load();
      } catch {
        toast("Could not remove mailbox", "error");
      } finally {
        setRemovingMailboxId(null);
      }
    },
    [selectedMailboxId, load, toast]
  );

  const handleAiCompose = useCallback(async () => {
    if (!aiComposePrompt.trim()) {
      toast("Describe the email you want", "error");
      return;
    }
    setAiComposing(true);
    try {
      const res = await fetch("/api/admin/marketing/email/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiComposePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI compose failed");
      setSubject(data.subject);
      setHtml(data.html);
      toast("Draft ready - review before sending", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI compose failed", "error");
    } finally {
      setAiComposing(false);
    }
  }, [aiComposePrompt, toast]);

  const handleGenerateTemplate = useCallback(async () => {
    if (!templatePrompt.trim()) {
      toast("Describe the template you want", "error");
      return;
    }
    setGeneratingTemplate(true);
    try {
      const res = await fetch("/api/admin/marketing/email/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: templatePrompt, includeImage: templateIncludeImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Template generation failed");
      setDraftTemplate(data);
      toast("Template drafted - name it and save", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Template generation failed", "error");
    } finally {
      setGeneratingTemplate(false);
    }
  }, [templatePrompt, templateIncludeImage, toast]);

  const handleSaveTemplate = useCallback(async () => {
    if (!draftTemplate || !templateName.trim()) {
      toast("Name the template before saving", "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/marketing/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          subject: draftTemplate.subject,
          html: draftTemplate.html,
          imageUrl: draftTemplate.imageUrl,
          generatedByAi: true,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast("Template saved", "success");
      setDraftTemplate(null);
      setTemplateName("");
      setTemplatePrompt("");
      await load();
    } catch {
      toast("Could not save template", "error");
    }
  }, [draftTemplate, templateName, load, toast]);

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/admin/marketing/email/templates?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        await load();
      } catch {
        toast("Could not delete template", "error");
      }
    },
    [load, toast]
  );

  const handleUseTemplate = useCallback(
    (template: EmailTemplate) => {
      setSubject(template.subject);
      setHtml(template.html);
      setTab("campaigns");
      toast(`Loaded "${template.name}" into the composer`, "success");
    },
    [toast]
  );

  const handleFindProspects = useCallback(async () => {
    if (!prospectPrompt.trim()) {
      toast("Describe who you're looking for", "error");
      return;
    }
    setFindingProspects(true);
    try {
      const res = await fetch("/api/admin/marketing/email/prospects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prospectPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      toast(`Found ${data.prospects?.length ?? 0} suggested prospect(s)`, "success");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Search failed", "error");
    } finally {
      setFindingProspects(false);
    }
  }, [prospectPrompt, load, toast]);

  const handleProspectAction = useCallback(
    async (id: string, status: Prospect["status"], email?: string) => {
      try {
        const res = await fetch("/api/admin/marketing/email/prospects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status, email }),
        });
        if (!res.ok) throw new Error("Update failed");
        if (status === "promoted") toast("Promoted to lead", "success");
        await load();
      } catch {
        toast("Could not update prospect", "error");
      }
    },
    [load, toast]
  );

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

      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {(
          [
            { key: "inbox", label: "Inbox" },
            { key: "leads", label: `Leads${leads.length > 0 ? ` (${leads.length})` : ""}` },
            { key: "prospects", label: `Prospects${prospects.length > 0 ? ` (${prospects.length})` : ""}` },
            { key: "templates", label: `Templates${templates.length > 0 ? ` (${templates.length})` : ""}` },
            { key: "campaigns", label: "Campaigns" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <div className="space-y-4">
          {/* Account switcher - manage several mailboxes from one place, Gmail-style */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMailboxId("all")}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedMailboxId === "all"
                  ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                  : "border-border text-text-secondary hover:bg-muted"
              }`}
            >
              <InboxIcon className="h-3.5 w-3.5" /> All inboxes
              {entries.length > 0 && <span className="opacity-70">{entries.filter((e) => !e.archived).length}</span>}
            </button>
            {mailboxes.map((m) => {
              const count = entries.filter((e) => !e.archived && e.mailboxId === m.id).length;
              const active = selectedMailboxId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMailboxId(m.id)}
                  title={m.status === "error" ? m.lastError ?? "Connection error" : m.email}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                      : "border-border text-text-secondary hover:bg-muted"
                  }`}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: m.color }}
                    aria-hidden="true"
                  >
                    {m.displayName.charAt(0).toUpperCase()}
                  </span>
                  {m.displayName}
                  {m.status === "error" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  {count > 0 && <span className="opacity-70">{count}</span>}
                </button>
              );
            })}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowAddMailbox((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Add email account
              </button>
            )}
          </div>

          {showAddMailbox && isSuperAdmin && (
            <Card className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="h-4 w-4" /> Connect a mailbox
              </p>
              <p className="text-xs text-text-secondary">
                Works with Gmail, Outlook, Zoho, or any standard IMAP/SMTP mailbox. For Gmail, use an{" "}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  app password
                </a>{" "}
                rather than your normal password.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  value={mailboxForm.email}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email address (e.g. support@yourcompany.com)"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  type="text"
                  value={mailboxForm.displayName}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Display name (optional, e.g. Support)"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  type="text"
                  value={mailboxForm.imapHost}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, imapHost: e.target.value }))}
                  placeholder="IMAP host (e.g. imap.gmail.com)"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={mailboxForm.imapPort}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, imapPort: e.target.value }))}
                  placeholder="Port (993)"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={mailboxForm.imapUser}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, imapUser: e.target.value }))}
                  placeholder="IMAP username"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  value={mailboxForm.imapPass}
                  onChange={(e) => setMailboxForm((f) => ({ ...f, imapPass: e.target.value }))}
                  placeholder="IMAP password / app password"
                  className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-text-secondary sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={mailboxForm.imapSecure}
                    onChange={(e) => setMailboxForm((f) => ({ ...f, imapSecure: e.target.checked }))}
                  />
                  Use TLS (leave on unless your provider says otherwise)
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={mailboxForm.useCustomSmtp}
                    onChange={(e) => setMailboxForm((f) => ({ ...f, useCustomSmtp: e.target.checked }))}
                  />
                  Send from this mailbox&apos;s own SMTP (otherwise campaigns send from the site&apos;s default sender)
                </label>
                {mailboxForm.useCustomSmtp && (
                  <>
                    <input
                      type="text"
                      value={mailboxForm.smtpHost}
                      onChange={(e) => setMailboxForm((f) => ({ ...f, smtpHost: e.target.value }))}
                      placeholder="SMTP host (e.g. smtp.gmail.com)"
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={mailboxForm.smtpPort}
                      onChange={(e) => setMailboxForm((f) => ({ ...f, smtpPort: e.target.value }))}
                      placeholder="Port (465)"
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={mailboxForm.smtpUser}
                      onChange={(e) => setMailboxForm((f) => ({ ...f, smtpUser: e.target.value }))}
                      placeholder="SMTP username (defaults to IMAP username)"
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="password"
                      value={mailboxForm.smtpPass}
                      onChange={(e) => setMailboxForm((f) => ({ ...f, smtpPass: e.target.value }))}
                      placeholder="SMTP password (defaults to IMAP password)"
                      className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                    />
                  </>
                )}
              </div>
              <Button size="sm" loading={connectingMailbox} onClick={handleAddMailbox}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Test &amp; connect
              </Button>

              {mailboxes.length > 0 && (
                <div className="border-t border-border/60 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Connected mailboxes</p>
                  <ul className="mt-2 space-y-1.5">
                    {mailboxes.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: m.color }}
                            aria-hidden="true"
                          >
                            {m.displayName.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate text-foreground">{m.displayName}</span>
                          <span className="truncate text-xs text-text-secondary">{m.email}</span>
                        </span>
                        {m.id === LEGACY_MAILBOX_ID ? (
                          <span className="shrink-0 text-xs text-text-secondary">via env config</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveMailbox(m.id)}
                            disabled={removingMailboxId === m.id}
                            className="shrink-0 text-text-secondary hover:text-red-600"
                            aria-label={`Remove ${m.displayName}`}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{entries.length} cached message(s)</p>
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
              <RefreshCw className="h-3.5 w-3.5" /> Sync inbox
            </Button>
          </div>
          {entries.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No messages yet. Click &quot;Sync inbox&quot; to pull from your connected mailbox
              {mailboxes.length > 1 ? "es" : ""}.
            </Card>
          ) : (
            <div className="space-y-2">
              {entries
                .filter((e) => !e.archived && (selectedMailboxId === "all" || e.mailboxId === selectedMailboxId))
                .map((entry) => {
                  const source = mailboxes.find((m) => m.id === entry.mailboxId);
                  return (
                    <Card key={entry.id} className="p-4">
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
                            {selectedMailboxId === "all" && source && mailboxes.length > 1 && (
                              <span
                                className="ml-auto flex items-center gap-1 text-[11px] text-text-secondary"
                                title={source.email}
                              >
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: source.color }}
                                  aria-hidden="true"
                                />
                                {source.displayName}
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
                  );
                })}
            </div>
          )}
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {leads.length} lead(s) - auto-captured from inbox triage, promoted prospects, or added manually.
          </p>
          {leads.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No leads yet. Sync your inbox, or use the Prospects tab to have AI suggest cold-outreach targets.
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

      {tab === "prospects" && (
        <div className="space-y-6">
          <Card className="space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Search className="h-4 w-4" /> AI cold-lead finder
            </p>
            <p className="text-xs text-text-secondary">
              Describe who you want to reach. AI brainstorms matching companies/roles and pattern-guesses likely
              email addresses - these are <strong>unverified suggestions</strong>, not a paid contact database, so
              confirm before relying on them. Review each one below, then Promote to turn it into a real lead.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={prospectPrompt}
                onChange={(e) => setProspectPrompt(e.target.value)}
                placeholder="e.g. VP of Marketing at 20-50 person B2B SaaS companies"
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
              <Button size="sm" loading={findingProspects} onClick={handleFindProspects}>
                <Sparkles className="h-3.5 w-3.5" /> Find prospects
              </Button>
            </div>
          </Card>

          {prospects.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No prospects yet - describe your ideal customer above.
            </Card>
          ) : (
            <div className="space-y-2">
              {prospects.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{p.name ?? p.title ?? "Unnamed role"}</span>
                        <span className="text-sm text-text-secondary">at {p.company}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "promoted"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : p.status === "confirmed"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-muted text-text-secondary"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{p.rationale}</p>
                      {p.guessedEmails.length > 0 && (
                        <p className="mt-1 text-xs text-text-secondary">
                          Guessed: {p.guessedEmails.join(", ")}
                        </p>
                      )}
                    </div>
                    {p.status !== "promoted" && p.status !== "rejected" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleProspectAction(p.id, "promoted", p.guessedEmails[0])}
                          className="text-text-secondary hover:text-emerald-600"
                          aria-label="Promote to lead"
                          title="Promote to lead"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProspectAction(p.id, "rejected")}
                          className="text-text-secondary hover:text-red-600"
                          aria-label="Reject"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {p.status === "promoted" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-6">
          <Card className="space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4" /> Generate a template with AI
            </p>
            <input
              type="text"
              value={templatePrompt}
              onChange={(e) => setTemplatePrompt(e.target.value)}
              placeholder="e.g. Product launch announcement for our new AI course track"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={templateIncludeImage}
                onChange={(e) => setTemplateIncludeImage(e.target.checked)}
              />
              <ImageIcon className="h-3.5 w-3.5" /> Include an AI-generated header image
            </label>
            <Button size="sm" loading={generatingTemplate} onClick={handleGenerateTemplate}>
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </Button>

            {draftTemplate && (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border/60 p-3">
                <p className="text-xs font-medium text-text-secondary">Preview</p>
                {draftTemplate.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draftTemplate.imageUrl} alt="" className="max-h-40 w-full rounded object-cover" />
                )}
                <p className="text-sm font-semibold text-foreground">{draftTemplate.subject}</p>
                <div
                  className="rounded bg-muted/40 p-3 text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: draftTemplate.html }}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Name this template"
                    className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                  />
                  <Button size="sm" onClick={handleSaveTemplate}>
                    Save template
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {templates.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-secondary">
              No saved templates yet - generate one above.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="shrink-0 text-text-secondary hover:text-red-600"
                      aria-label="Delete template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary">{t.subject}</p>
                  {t.generatedByAi && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      <Sparkles className="h-3 w-3" /> AI-generated
                    </span>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => handleUseTemplate(t)}>
                    Use in campaign
                  </Button>
                </Card>
              ))}
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

            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-teal/40 bg-teal/5 p-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={aiComposePrompt}
                onChange={(e) => setAiComposePrompt(e.target.value)}
                placeholder="Tell AI what this email should say..."
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
              <Button variant="secondary" size="sm" loading={aiComposing} onClick={handleAiCompose}>
                <Sparkles className="h-3.5 w-3.5" /> Write with AI
              </Button>
            </div>

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
