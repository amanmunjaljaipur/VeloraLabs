"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AlertTriangle, Link2, Loader2, Send, Unlink } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PublicAccount {
  id: string;
  platform: "facebook" | "instagram" | "linkedin";
  name: string;
  picture?: string | null;
  expiringSoon: boolean;
}

interface PostTarget {
  accountId: string;
  platform: string;
  status: "published" | "failed";
  platformPostId: string | null;
  error?: string;
}

interface MarketingPost {
  id: string;
  content: string;
  imageUrl: string | null;
  targets: PostTarget[];
  createdAt: string;
}

interface PerformanceRow {
  post: MarketingPost;
  targets: { platform: string; status: string; analytics: Record<string, number> | null }[];
}

const PLATFORM_META: Record<string, { label: string; letter: string; bg: string }> = {
  instagram: { label: "Instagram", letter: "IG", bg: "bg-pink-600" },
  facebook: { label: "Facebook", letter: "FB", bg: "bg-blue-600" },
  linkedin: { label: "LinkedIn", letter: "IN", bg: "bg-sky-700" },
};

const TARGET_PLATFORMS = ["instagram", "facebook", "linkedin"] as const;

function platformMeta(platform: string) {
  return (
    PLATFORM_META[platform.toLowerCase()] ?? {
      label: platform,
      letter: platform.slice(0, 2).toUpperCase(),
      bg: "bg-muted-foreground",
    }
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const meta = platformMeta(platform);
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${meta.bg}`}
      title={meta.label}
      aria-label={meta.label}
    >
      {meta.letter}
    </span>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "You need super admin access to connect accounts",
  meta_not_configured: "Meta app credentials are not set up yet - add META_APP_ID and META_APP_SECRET",
  linkedin_not_configured:
    "LinkedIn app credentials are not set up yet - add LINKEDIN_ORG_CLIENT_ID and LINKEDIN_ORG_CLIENT_SECRET",
  meta_denied: "Meta connection was cancelled",
  linkedin_denied: "LinkedIn connection was cancelled",
  state_mismatch: "That connection attempt expired - try again",
  meta_no_pages_found: "No Facebook Pages found for this account",
  linkedin_no_organizations_found: "No LinkedIn Company Pages found for this account",
  meta_token_exchange_failed: "Meta did not accept the connection - try again",
  meta_long_lived_exchange_failed: "Meta did not accept the connection - try again",
  linkedin_token_exchange_failed: "LinkedIn did not accept the connection - try again",
};

export function MarketingBoard() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuperAdmin = session?.user?.role === "super_admin";

  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [metaConfigured, setMetaConfigured] = useState(false);
  const [linkedinConfigured, setLinkedinConfigured] = useState(false);
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, performanceRes] = await Promise.all([
        fetch("/api/admin/marketing/accounts", { cache: "no-store" }),
        fetch("/api/admin/marketing/performance", { cache: "no-store" }),
      ]);
      const accountsData = await accountsRes.json();
      const performanceData = await performanceRes.json();

      setAccounts(accountsData.accounts ?? []);
      setMetaConfigured(Boolean(accountsData.metaConfigured));
      setLinkedinConfigured(Boolean(accountsData.linkedinConfigured));
      setRows(performanceData.rows ?? []);
    } catch {
      toast("Could not load the marketing board", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Surface OAuth connect/callback results once, then clean the URL.
  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) toast(ERROR_MESSAGES[error] ?? "Connection failed", "error");
    if (connected) toast(`Connected to ${platformMeta(connected).label}`, "success");
    if (error || connected) router.replace("/admin/marketing");
  }, [searchParams, router, toast]);

  const accountsByPlatform = useMemo(() => {
    const map = new Map<string, PublicAccount[]>();
    for (const a of accounts) {
      const list = map.get(a.platform) ?? [];
      list.push(a);
      map.set(a.platform, list);
    }
    return map;
  }, [accounts]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePublish() {
    if (!content.trim()) {
      toast("Write something before publishing", "warning");
      return;
    }
    if (selected.size === 0) {
      toast("Choose at least one connected account", "warning");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch("/api/admin/marketing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          accountIds: Array.from(selected),
          ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const anyFailed = (data.post?.targets ?? []).some((t: PostTarget) => t.status === "failed");

      if (!res.ok) {
        toast(data.error || "Could not publish", "error");
      } else if (anyFailed) {
        toast("Published to some platforms - check the table below for details", "warning");
      } else {
        toast("Published", "success");
      }
      setContent("");
      setImageUrl("");
      setSelected(new Set());
      void load();
    } catch {
      toast("Could not publish", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDisconnect(id: string) {
    setDisconnectingId(id);
    try {
      const res = await fetch(`/api/admin/marketing/accounts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Disconnected", "success");
      void load();
    } catch {
      toast("Could not disconnect", "error");
    } finally {
      setDisconnectingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Connection status */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TARGET_PLATFORMS.map((platform) => {
          const meta = platformMeta(platform);
          const connectedAccounts = accountsByPlatform.get(platform) ?? [];
          const configured = platform === "linkedin" ? linkedinConfigured : metaConfigured;
          const connectHref =
            platform === "linkedin" ? "/api/admin/marketing/connect/linkedin" : "/api/admin/marketing/connect/meta";

          return (
            <Card key={platform} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${meta.bg}`}
                  aria-hidden="true"
                >
                  {meta.letter}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{meta.label}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {connectedAccounts.length > 0
                      ? `${connectedAccounts.length} connected`
                      : configured
                        ? "Not connected"
                        : "Not set up yet"}
                  </p>
                </div>
                {isSuperAdmin && (
                  <a href={configured ? connectHref : undefined}>
                    <Button variant="secondary" size="sm" disabled={!configured}>
                      <Link2 className="h-3.5 w-3.5" /> Connect
                    </Button>
                  </a>
                )}
              </div>

              {connectedAccounts.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                  {connectedAccounts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-foreground">
                        {a.name}
                        {a.expiringSoon && (
                          <span className="ml-1.5 text-xs text-amber-600">(reconnect soon)</span>
                        )}
                      </span>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(a.id)}
                          disabled={disconnectingId === a.id}
                          className="shrink-0 text-text-secondary hover:text-red-600"
                          aria-label={`Disconnect ${a.name}`}
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {!metaConfigured && !linkedinConfigured && (
        <Card className="flex items-start gap-4 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">No platforms configured yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              This board talks directly to Meta and LinkedIn - no third-party vendor in between.
              Set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">META_APP_ID</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">META_APP_SECRET</code> for
              Instagram and Facebook, and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">LINKEDIN_ORG_CLIENT_ID</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">LINKEDIN_ORG_CLIENT_SECRET</code>{" "}
              for LinkedIn, then a super admin can connect each account above.
            </p>
          </div>
        </Card>
      )}

      {/* Composer */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Compose</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Write once, choose where it goes, publish everywhere in one click.
        </p>

        <div className="mt-5 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="What do you want to share?"
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (required for Instagram, optional elsewhere)"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          />

          {accounts.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Connect at least one account above before you can publish.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => {
                const isSelected = selected.has(account.id);
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => toggleSelected(account.id)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <PlatformBadge platform={account.platform} />
                    {account.name}
                  </button>
                );
              })}
            </div>
          )}

          <Button variant="cta" size="lg" loading={publishing} onClick={handlePublish}>
            <Send className="h-4 w-4" /> Publish now
          </Button>
        </div>
      </Card>

      {/* Unified performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Performance</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Every post published through this board, across every platform, in one place.
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-text-secondary">
            Nothing published yet. Once you publish a post above, it will show up here with its
            performance.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                  <th className="pb-2 pr-4 font-medium">Post</th>
                  <th className="pb-2 pr-4 font-medium">Platforms</th>
                  <th className="pb-2 pr-4 font-medium">Reach</th>
                  <th className="pb-2 pr-4 font-medium">Engagement</th>
                  <th className="pb-2 font-medium">Published</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ post, targets }) => {
                  const reach = targets.reduce(
                    (sum, t) => sum + (t.analytics?.reach ?? t.analytics?.impressions ?? 0),
                    0
                  );
                  const engagement = targets.reduce(
                    (sum, t) =>
                      sum +
                      (t.analytics
                        ? (t.analytics.likes ?? 0) +
                          (t.analytics.comments ?? 0) +
                          (t.analytics.shares ?? 0) +
                          (t.analytics.post_engaged_users ?? 0)
                        : 0),
                    0
                  );
                  const hasAnyData = targets.some((t) => t.analytics);

                  return (
                    <tr key={post.id} className="border-b border-border/60">
                      <td className="max-w-xs truncate py-3 pr-4 text-foreground">{post.content}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {targets.map((t, i) => (
                            <span key={i} title={t.status === "failed" ? "Failed to publish" : undefined}>
                              <PlatformBadge platform={t.platform} />
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{hasAnyData ? reach : "No data yet"}</td>
                      <td className="py-3 pr-4 text-text-secondary">{hasAnyData ? engagement : "No data yet"}</td>
                      <td className="py-3 text-text-secondary">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
