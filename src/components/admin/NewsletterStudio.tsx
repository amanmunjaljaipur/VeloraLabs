"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Newspaper,
  RefreshCw,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface DraftPreview {
  id: string;
  title: string;
  intro: string;
  storyCount: number;
  status: string;
  updatedAt: string;
  html: string;
}

interface NewsletterStudioProps {
  mcpUrl: string;
}

export function NewsletterStudio({ mcpUrl }: NewsletterStudioProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<DraftPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [emailSummary, setEmailSummary] = useState<{
    subscriberCount: number;
    sentCount: number;
    failedCount: number;
    pdfFilename: string;
    configured: boolean;
  } | null>(null);

  const loadDraft = useCallback(async () => {
    const res = await fetch("/api/admin/newsletter/draft");
    if (!res.ok) return;
    const data = (await res.json()) as { draft: DraftPreview | null };
    setDraft(data.draft);
  }, []);

  useEffect(() => {
    loadDraft().finally(() => setLoading(false));
  }, [loadDraft]);

  const handleGenerate = async () => {
    setGenerating(true);
    setSentUrl(null);
    setEmailSummary(null);
    try {
      const res = await fetch("/api/admin/newsletter/generate", { method: "POST" });
      const data = (await res.json()) as { error?: string; draft?: DraftPreview };
      if (!res.ok) {
        toast(data.error || "Failed to generate newsletter", "error");
        return;
      }
      setDraft(data.draft ?? null);
      toast("Newsletter draft created from latest AI news", "success");
    } catch {
      toast("Failed to generate newsletter", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        edition?: { title: string; publicUrl: string };
        email?: {
          subscriberCount: number;
          sentCount: number;
          failedCount: number;
          pdfFilename: string;
          configured: boolean;
        };
      };
      if (!res.ok) {
        toast(data.error || "Failed to send newsletter", "error");
        return;
      }
      setSentUrl(data.edition?.publicUrl ?? null);
      setEmailSummary(data.email ?? null);
      setDraft(null);
      if (data.email?.configured) {
        toast(
          `Published and emailed PDF to ${data.email.sentCount} of ${data.email.subscriberCount} subscribers`,
          data.email.failedCount > 0 ? "error" : "success"
        );
      } else {
        toast(
          `Published online. Set RESEND_API_KEY to email the PDF to subscribers.`,
          "error"
        );
      }
    } catch {
      toast("Failed to send newsletter", "error");
    } finally {
      setSending(false);
    }
  };

  const handleCopyMcpUrl = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      toast("MCP link copied", "success");
    } catch {
      toast("Could not copy link", "error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 md:px-8">
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">LLM / MCP access</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Connect any MCP-compatible LLM (Grok, Claude, Cursor) to generate and email
              newsletters. Use your <code className="text-xs">NEWSLETTER_MCP_API_KEY</code> as a
              Bearer token.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <a
                href={mcpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-teal hover:underline"
              >
                {mcpUrl}
              </a>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyMcpUrl}>
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
                <a href={mcpUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-teal/20 bg-teal/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-semibold text-foreground">Create newsletter</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Fetches the latest AI news from the internet, adds mental-model clarity lenses and
              images, then publishes online and emails a PDF to all subscribers when you send.
            </p>
          </div>
          <Button onClick={handleGenerate} loading={generating} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
            {generating ? "Fetching news…" : "Create newsletter"}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-secondary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading draft…
        </div>
      ) : !draft ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No draft yet. Click <strong>Create newsletter</strong> to pull the latest AI stories
            from OpenAI, Google AI, MIT Tech Review, TechCrunch, and The Verge.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">{draft.title}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {draft.storyCount} stories · Updated{" "}
                {new Date(draft.updatedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <Button onClick={handleSend} loading={sending} size="lg" className="shrink-0">
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send newsletter + PDF email"}
            </Button>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
              Preview
            </div>
            <div
              className="p-4 md:p-8"
              dangerouslySetInnerHTML={{ __html: draft.html }}
            />
          </Card>
        </>
      )}

      {sentUrl && (
        <Card className="border-teal/30 bg-teal/5">
          <p className="font-medium text-foreground">Newsletter is live</p>
          <Link
            href={sentUrl}
            className="mt-2 inline-flex items-center gap-1 text-sm text-teal hover:underline"
          >
            View published edition
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {emailSummary && (
            <p className="mt-3 text-sm text-text-secondary">
              PDF <span className="font-medium text-foreground">{emailSummary.pdfFilename}</span>
              {emailSummary.configured ? (
                <>
                  {" "}
                  emailed to {emailSummary.sentCount} of {emailSummary.subscriberCount} subscribers
                  {emailSummary.failedCount > 0
                    ? ` (${emailSummary.failedCount} failed)`
                    : ""}
                  .
                </>
              ) : (
                <> — email delivery skipped (RESEND_API_KEY not configured).</>
              )}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}