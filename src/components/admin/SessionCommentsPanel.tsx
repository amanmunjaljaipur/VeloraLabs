"use client";

import type { AdminVideoCommentRow } from "@/app/api/admin/session-comments/route";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, MessageSquare, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const audienceLabels: Record<string, string> = {
  students: "Students",
  engineers: "Engineers",
  professionals: "Professionals",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SessionCommentsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<AdminVideoCommentRow[]>([]);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    const res = await fetch("/api/admin/session-comments");
    if (!res.ok) {
      toast("Failed to load comments", "error");
      return;
    }
    const data = (await res.json()) as { comments: AdminVideoCommentRow[] };
    setComments(data.comments);
  }, [toast]);

  useEffect(() => {
    fetchComments().finally(() => setLoading(false));
  }, [fetchComments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return comments.filter((comment) => {
      if (audienceFilter !== "all" && comment.sessionAudience !== audienceFilter) {
        return false;
      }
      if (!q) return true;
      return (
        comment.body.toLowerCase().includes(q) ||
        comment.authorName.toLowerCase().includes(q) ||
        comment.email.toLowerCase().includes(q) ||
        comment.sessionTitle.toLowerCase().includes(q) ||
        comment.sessionId.toLowerCase().includes(q)
      );
    });
  }, [audienceFilter, comments, search]);

  async function handleDelete(commentId: string) {
    if (!window.confirm("Remove this comment? It will no longer appear publicly.")) return;

    setDeletingId(commentId);
    const res = await fetch(`/api/admin/session-comments?id=${encodeURIComponent(commentId)}`, {
      method: "DELETE",
    });
    setDeletingId(null);

    if (!res.ok) {
      toast("Could not delete comment", "error");
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    toast("Comment removed", "success");
  }

  return (
    <section className="container-verlin space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-semibold text-foreground">Learner comments</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            All public comments from students, engineers, and product managers across session
            recordings.
          </p>
        </div>
        <p className="text-sm font-medium text-foreground">
          {comments.length} total · {filtered.length} shown
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments, learners, or sessions…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "students", "engineers", "professionals"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAudienceFilter(value)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                audienceFilter === value
                  ? "bg-accent-teal text-white"
                  : "bg-muted text-text-secondary hover:text-foreground"
              )}
            >
              {value === "all" ? "All tracks" : audienceLabels[value]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2 py-16 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center text-sm text-text-secondary">
          {comments.length === 0
            ? "No learner comments yet."
            : "No comments match your filters."}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <Card key={comment.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{comment.authorName}</p>
                    <Badge variant="audience">{comment.roleLabel}</Badge>
                    <Badge variant="audience">
                      {audienceLabels[comment.sessionAudience] ?? comment.sessionAudience}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{comment.email}</p>
                  <Link
                    href={`/sessions/${comment.sessionId}`}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
                  >
                    Day {comment.sessionDay}: {comment.sessionTitle}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <time
                    dateTime={comment.createdAt}
                    className="text-xs text-text-secondary"
                  >
                    {formatDate(comment.createdAt)}
                  </time>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={deletingId === comment.id}
                    onClick={() => handleDelete(comment.id)}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {comment.body}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}