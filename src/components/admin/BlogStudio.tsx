"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { BlogPost, BlogSequence } from "@/lib/blog/types";
import { formatContentDateTime } from "@/lib/utils";
import {
  CalendarClock,
  ExternalLink,
  Loader2,
  Pencil,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function defaultScheduleLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}

const STATUS_STYLE: Record<BlogPost["status"], string> = {
  draft: "bg-muted text-text-secondary",
  scheduled: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  published: "bg-teal/15 text-teal",
};

export function BlogStudio() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [sequences, setSequences] = useState<BlogSequence[]>([]);
  const [suggestedSequenceId, setSuggestedSequenceId] = useState("mental-models");
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmLabel, setLlmLabel] = useState<string | null>(null);

  const [sequenceId, setSequenceId] = useState("mental-models");
  const [customTopic, setCustomTopic] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("scheduled");
  const [scheduledLocal, setScheduledLocal] = useState(defaultScheduleLocal);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/blog");
    if (!res.ok) {
      toast("Failed to load blog studio", "error");
      return;
    }
    const data = (await res.json()) as {
      posts: BlogPost[];
      sequences: BlogSequence[];
      suggestedSequenceId: string;
      llmEnabled: boolean;
      llmLabel: string | null;
    };
    setPosts(data.posts);
    setSequences(data.sequences);
    setSuggestedSequenceId(data.suggestedSequenceId);
    setSequenceId(data.suggestedSequenceId);
    setLlmEnabled(data.llmEnabled);
    setLlmLabel(data.llmLabel);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const selectedSequence = useMemo(
    () => sequences.find((s) => s.id === sequenceId),
    [sequences, sequenceId]
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        sequenceId,
        customTopic: customTopic.trim() || undefined,
        status,
      };
      if (status === "scheduled") {
        body.scheduledAt = toIsoFromLocal(scheduledLocal);
      }

      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { post?: BlogPost; error?: string };
      if (!res.ok) {
        toast(data.error || "Failed to create post", "error");
        return;
      }
      toast(
        data.post?.generatedBy === "ai"
          ? "Blog generated with AI and saved"
          : "Blog created (template — add GROQ_API_KEY for AI copy)",
        "success"
      );
      setCustomTopic("");
      await load();
    } catch {
      toast("Failed to create post", "error");
    } finally {
      setCreating(false);
    }
  }

  async function patchPost(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast(data.error || "Update failed", "error");
        return;
      }
      toast("Post updated", "success");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function removePost(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Delete failed", "error");
        return;
      }
      toast("Post deleted", "success");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Blog Studio…
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Blog Studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Pick a daily sequence, generate a post with Gen AI, set date &amp; time, and publish on a
          schedule. Cron publishes due posts every hour.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          AI:{" "}
          {llmEnabled
            ? llmLabel ?? "enabled"
            : "template mode (set GROQ_API_KEY for free Llama generation)"}
          {" · "}
          Suggested next sequence:{" "}
          <button
            type="button"
            className="font-medium text-accent-teal hover:underline"
            onClick={() => setSequenceId(suggestedSequenceId)}
          >
            {sequences.find((s) => s.id === suggestedSequenceId)?.label ?? suggestedSequenceId}
          </button>
        </p>
      </div>

      <Card className="space-y-5 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-teal" />
          <h2 className="text-lg font-semibold">Create with Gen AI</h2>
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Sequence
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sequences.map((seq) => {
                const selected = sequenceId === seq.id;
                return (
                  <label
                    key={seq.id}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      selected
                        ? "border-accent-teal bg-accent-teal/5"
                        : "border-border hover:border-accent-teal/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sequence"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setSequenceId(seq.id)}
                    />
                    <span className="block text-sm font-medium text-foreground">{seq.label}</span>
                    <span className="mt-1 block text-xs text-text-secondary">{seq.description}</span>
                  </label>
                );
              })}
            </div>
            {selectedSequence ? (
              <p className="mt-2 text-xs text-text-muted">
                AI brief: {selectedSequence.topicPrompt.slice(0, 140)}…
              </p>
            ) : null}
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">
              Optional custom topic angle
            </span>
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Why token limits matter for student homework"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Publish mode</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <option value="draft">Save as draft</option>
                <option value="scheduled">Schedule date &amp; time</option>
                <option value="published">Publish now</option>
              </select>
            </label>

            {status === "scheduled" ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Schedule (local time)
                </span>
                <input
                  type="datetime-local"
                  required
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                />
              </label>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>

          <Button type="submit" disabled={creating} loading={creating}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {status === "published"
              ? "Generate & publish"
              : status === "scheduled"
                ? "Generate & schedule"
                : "Generate draft"}
          </Button>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Posts pipeline</h2>
        {posts.length === 0 ? (
          <Card className="p-8 text-center text-sm text-text-secondary">
            No blog posts yet. Create your first sequence post above.
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[post.status]}`}
                      >
                        {post.status}
                      </span>
                      <span className="text-xs text-text-muted">{post.sequenceLabel}</span>
                      <span className="text-xs text-text-muted">· {post.generatedBy}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-foreground">{post.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">{post.description}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {post.status === "scheduled" && post.scheduledAt
                          ? `Goes live ${formatContentDateTime(post.scheduledAt)}`
                          : `Published ${formatContentDateTime(post.publishedAt)}`}
                      </span>
                      <span>{post.duration} read</span>
                      <span className="font-mono">/{post.slug}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.status === "published" ? (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                    ) : null}
                    {post.status !== "published" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === post.id}
                        onClick={() => void patchPost(post.id, { status: "published" })}
                      >
                        <Rocket className="mr-1 h-3.5 w-3.5" />
                        Publish now
                      </Button>
                    ) : null}
                    {post.status === "draft" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === post.id}
                        onClick={() =>
                          void patchPost(post.id, {
                            status: "scheduled",
                            scheduledAt: toIsoFromLocal(scheduledLocal),
                          })
                        }
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Schedule
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === post.id}
                      onClick={() => void removePost(post.id, post.title)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5 text-red-600" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
