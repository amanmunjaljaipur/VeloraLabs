"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { VideoComment } from "@/lib/video-comments";
import { ROLE_LABELS } from "@/types/roles";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface CommentsResponse {
  comments: VideoComment[];
  canComment: boolean;
  viewerEmail: string;
  isAdmin: boolean;
}

interface SessionVideoCommentsProps {
  sessionId: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function formatCommentDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SessionVideoComments({ sessionId }: SessionVideoCommentsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [canComment, setCanComment] = useState(false);
  const [viewerEmail, setViewerEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [body, setBody] = useState("");

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/session-comments/${sessionId}`);
    if (!res.ok) {
      toast("Could not load comments", "error");
      return;
    }
    const data = (await res.json()) as CommentsResponse;
    setComments(data.comments);
    setCanComment(data.canComment);
    setViewerEmail(data.viewerEmail);
    setIsAdmin(data.isAdmin);
  }, [sessionId, toast]);

  useEffect(() => {
    fetchComments().finally(() => setLoading(false));
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setPosting(true);
    const res = await fetch(`/api/session-comments/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    setPosting(false);

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      toast(payload.error || "Could not post comment", "error");
      return;
    }

    const payload = (await res.json()) as { comment: VideoComment };
    setComments((prev) => [...prev, payload.comment]);
    setBody("");
    toast("Comment posted", "success");
  }

  const normalizedViewer = normalizeEmail(viewerEmail);
  const ownComments = comments.filter(
    (comment) => normalizeEmail(comment.email) === normalizedViewer
  );

  return (
    <section className="space-y-5" aria-labelledby="session-comments-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-teal" />
          <h2 id="session-comments-heading" className="text-lg font-semibold text-foreground">
            Discussion
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          {comments.length === 0
            ? "No comments yet"
            : `${comments.length} public comment${comments.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {canComment && ownComments.length > 0 && (
        <p className="text-sm text-text-secondary">
          You&apos;ve shared {ownComments.length} comment{ownComments.length === 1 ? "" : "s"}{" "}
          on this session - they appear below with a{" "}
          <span className="font-medium text-teal">You</span> badge.
        </p>
      )}

      {loading ? (
        <Card className="flex items-center justify-center gap-2 py-10 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments…
        </Card>
      ) : comments.length === 0 ? (
        <Card className="py-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-text-secondary/60" />
          <p className="mt-3 text-sm text-text-secondary">
            {canComment
              ? "Be the first to share a question, insight, or takeaway from this session."
              : "Learners have not commented on this session yet."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isOwn = normalizeEmail(comment.email) === normalizedViewer;
            return (
              <li key={comment.id}>
                <Card
                  className={
                    isOwn
                      ? "border-teal/30 bg-teal/5 p-5"
                      : "p-5"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{comment.authorName}</p>
                        {isOwn && (
                          <Badge variant="audience" className="bg-teal/15 text-teal">
                            You
                          </Badge>
                        )}
                        <Badge variant="audience">
                          {ROLE_LABELS[comment.role] ?? comment.role}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <p className="mt-0.5 text-xs text-text-secondary">{comment.email}</p>
                      )}
                    </div>
                    <time
                      dateTime={comment.createdAt}
                      className="shrink-0 text-xs text-text-secondary"
                    >
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {comment.body}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {canComment && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor={`comment-${sessionId}`} className="block text-sm font-medium text-foreground">
              Add a comment
            </label>
            <textarea
              id={`comment-${sessionId}`}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder="Share a question, insight, or takeaway from this session. Comments are visible to everyone in your cohort."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-text-secondary">
                {body.length}/2000 · Public to all learners on this track
              </p>
              <Button type="submit" loading={posting} disabled={!body.trim()}>
                <Send className="mr-1.5 h-4 w-4" />
                Post comment
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAdmin && !canComment && (
        <p className="text-xs text-text-secondary">
          Admin view - all learner comments on this session are shown above, including author email.
        </p>
      )}
    </section>
  );
}