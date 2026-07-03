"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ExternalLink, Loader2, Newspaper, RefreshCw, Send } from "lucide-react";
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

export function NewsletterStudio() {
  const { toast } = useToast();
  const [draft, setDraft] = useState<DraftPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);

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
      };
      if (!res.ok) {
        toast(data.error || "Failed to send newsletter", "error");
        return;
      }
      setSentUrl(data.edition?.publicUrl ?? null);
      setDraft(null);
      toast(`Sent: ${data.edition?.title}`, "success");
    } catch {
      toast("Failed to send newsletter", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 md:px-8">
      <Card className="border-teal/20 bg-teal/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-semibold text-foreground">Create newsletter</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Fetches the latest AI news from the internet, adds mental-model clarity lenses and
              images, then lets you preview before sending live.
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
              {sending ? "Sending…" : "Send newsletter"}
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
        </Card>
      )}
    </div>
  );
}