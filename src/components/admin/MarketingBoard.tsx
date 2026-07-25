"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { GrowthAdvisor } from "@/components/admin/GrowthAdvisor";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Download,
  Flame,
  ImagePlus,
  Layers,
  Link2,
  Loader2,
  Megaphone,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { upload } from "@vercel/blob/client";
import JSZip from "jszip";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PublicAccount {
  id: string;
  platform: "facebook" | "instagram" | "linkedin" | "x";
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

interface ViralIdea {
  platform: PublicAccount["platform"];
  topic: string;
  hook: string;
  content: string;
  hashtags: string[];
  imageStyle: string;
  imagePrompt: string;
  format: "single-image" | "carousel" | "text-only" | "pdf-document";
  viralityScore: number;
  rationale: string;
  bestTimeHint: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  imageUrl: string | null;
  accountIds: string[];
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  error?: string;
}

const FORMAT_LABELS: Record<ViralIdea["format"], string> = {
  "single-image": "Single image",
  carousel: "Carousel",
  "text-only": "Text only",
  "pdf-document": "PDF document",
};

const PLATFORM_META: Record<string, { label: string; letter: string; bg: string; gradient: string }> = {
  instagram: {
    label: "Instagram",
    letter: "IG",
    bg: "bg-pink-600",
    gradient: "bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600",
  },
  facebook: { label: "Facebook", letter: "FB", bg: "bg-blue-600", gradient: "bg-gradient-to-br from-blue-500 to-blue-700" },
  linkedin: { label: "LinkedIn", letter: "IN", bg: "bg-sky-700", gradient: "bg-gradient-to-br from-sky-500 to-sky-800" },
  x: { label: "X", letter: "X", bg: "bg-neutral-900", gradient: "bg-gradient-to-br from-neutral-700 to-neutral-950" },
};

const TARGET_PLATFORMS = ["instagram", "facebook", "linkedin", "x"] as const;

function platformMeta(platform: string) {
  return (
    PLATFORM_META[platform.toLowerCase()] ?? {
      label: platform,
      letter: platform.slice(0, 2).toUpperCase(),
      bg: "bg-muted-foreground",
      gradient: "bg-muted-foreground",
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
  x_not_configured: "X app credentials are not set up yet - add X_CLIENT_ID and X_CLIENT_SECRET",
  meta_denied: "Meta connection was cancelled",
  linkedin_denied: "LinkedIn connection was cancelled",
  x_denied: "X connection was cancelled",
  state_mismatch: "That connection attempt expired - try again",
  meta_no_pages_found: "No Facebook Pages found for this account",
  linkedin_no_organizations_found: "No LinkedIn Company Pages found for this account",
  x_no_account_found: "Could not read the X account - try again",
  meta_token_exchange_failed: "Meta did not accept the connection - try again",
  meta_long_lived_exchange_failed: "Meta did not accept the connection - try again",
  linkedin_token_exchange_failed: "LinkedIn did not accept the connection - try again",
  x_token_exchange_failed: "X did not accept the connection - try again",
  x_pkce_missing: "That connection attempt expired - try again",
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
  const [xConfigured, setXConfigured] = useState(false);
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "scheduled" | "performance" | "growth">("create");

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiWriting, setAiWriting] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImageGenerating, setAiImageGenerating] = useState(false);

  const [viralTopic, setViralTopic] = useState("");
  const [viralPlatforms, setViralPlatforms] = useState<Set<string>>(new Set(TARGET_PLATFORMS));
  const [viralLoading, setViralLoading] = useState(false);
  const [viralIdeas, setViralIdeas] = useState<ViralIdea[]>([]);
  const [applyingIdea, setApplyingIdea] = useState<number | null>(null);
  const [autoPilot, setAutoPilot] = useState(false);

  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const [perfFilter, setPerfFilter] = useState<string>("all");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [contentMode, setContentMode] = useState<"single" | "carousel" | "pdf-slides">("single");
  const [carouselUrlsText, setCarouselUrlsText] = useState("");
  const [slidesText, setSlidesText] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCarousel, setDownloadingCarousel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, performanceRes, scheduledRes] = await Promise.all([
        fetch("/api/admin/marketing/accounts", { cache: "no-store" }),
        fetch("/api/admin/marketing/performance", { cache: "no-store" }),
        fetch("/api/admin/marketing/scheduled", { cache: "no-store" }),
      ]);
      const accountsData = await accountsRes.json();
      const performanceData = await performanceRes.json();
      const scheduledData = await scheduledRes.json().catch(() => ({}));

      setAccounts(accountsData.accounts ?? []);
      setMetaConfigured(Boolean(accountsData.metaConfigured));
      setLinkedinConfigured(Boolean(accountsData.linkedinConfigured));
      setXConfigured(Boolean(accountsData.xConfigured));
      setRows(performanceData.rows ?? []);
      setScheduledPosts(
        ((scheduledData.posts ?? []) as ScheduledPost[]).filter((p) => p.status === "scheduled")
      );
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

  const totalReach = useMemo(
    () =>
      rows.reduce(
        (sum, r) =>
          sum + r.targets.reduce((s, t) => s + (t.analytics?.reach ?? t.analytics?.impressions ?? 0), 0),
        0
      ),
    [rows]
  );

  // Facebook and Instagram share one Meta OAuth flow; LinkedIn and X each have their own.
  const platformConnect = useMemo<Record<(typeof TARGET_PLATFORMS)[number], { configured: boolean; href: string }>>(
    () => ({
      facebook: { configured: metaConfigured, href: "/api/admin/marketing/connect/meta" },
      instagram: { configured: metaConfigured, href: "/api/admin/marketing/connect/meta" },
      linkedin: { configured: linkedinConfigured, href: "/api/admin/marketing/connect/linkedin" },
      x: { configured: xConfigured, href: "/api/admin/marketing/connect/x" },
    }),
    [metaConfigured, linkedinConfigured, xConfigured]
  );

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
      const carouselUrls =
        contentMode === "carousel"
          ? carouselUrlsText.split("\n").map((l) => l.trim()).filter(Boolean)
          : [];
      const slides = contentMode === "pdf-slides" ? parseSlides() : [];

      if (contentMode === "carousel" && carouselUrls.length < 2) {
        toast("Add at least 2 image URLs for a carousel (one per line)", "warning");
        setPublishing(false);
        return;
      }
      if (contentMode === "pdf-slides" && slides.length < 2) {
        toast("Add at least 2 slides for a PDF document post (one per line)", "warning");
        setPublishing(false);
        return;
      }

      const res = await fetch("/api/admin/marketing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          accountIds: Array.from(selected),
          ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
          ...(carouselUrls.length > 0 ? { imageUrls: carouselUrls } : {}),
          ...(slides.length > 0 ? { slides } : {}),
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const anyFailed = (data.post?.targets ?? []).some((t: PostTarget) => t.status === "failed");

      if (!res.ok) {
        toast(data.error || "Could not publish", "error");
      } else if (data.scheduled) {
        toast(`Scheduled for ${new Date(data.scheduled.scheduledAt).toLocaleString()}`, "success");
      } else if (anyFailed) {
        toast("Published to some platforms - check the table below for details", "warning");
      } else {
        toast("Published", "success");
      }
      setContent("");
      setImageUrl("");
      setSelected(new Set());
      setScheduledAt("");
      void load();
    } catch {
      toast("Could not publish", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleAiCompose() {
    if (!aiPrompt.trim()) {
      toast("Describe what you want to post about first", "warning");
      return;
    }
    setAiWriting(true);
    try {
      const platforms = Array.from(selected)
        .map((id) => accounts.find((a) => a.id === id)?.platform)
        .filter((p): p is PublicAccount["platform"] => Boolean(p));

      const res = await fetch("/api/admin/marketing/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, platforms }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "AI writing failed", "error");
        return;
      }
      setContent(data.content ?? "");
      toast("Draft written - edit anything you like", "success");
    } catch {
      toast("AI writing failed", "error");
    } finally {
      setAiWriting(false);
    }
  }

  async function handleAiImage() {
    if (!aiImagePrompt.trim()) {
      toast("Describe the image you want first", "warning");
      return;
    }
    setAiImageGenerating(true);
    try {
      const res = await fetch("/api/admin/marketing/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiImagePrompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Image generation failed", "error");
        return;
      }
      setImageUrl(data.url ?? "");
      toast("Image generated", "success");
    } catch {
      toast("Image generation failed", "error");
    } finally {
      setAiImageGenerating(false);
    }
  }

  async function handleGenerateViral() {
    setViralLoading(true);
    setViralIdeas([]);
    try {
      const res = await fetch("/api/admin/marketing/ai/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: viralTopic.trim() || undefined,
          platforms: Array.from(viralPlatforms),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Could not generate viral ideas", "error");
        return;
      }
      const ideas: ViralIdea[] = (data.ideas ?? []).sort(
        (a: ViralIdea, b: ViralIdea) => b.viralityScore - a.viralityScore
      );
      setViralIdeas(ideas);
      if (autoPilot && ideas.length > 0) {
        // Full auto: take the highest-scoring idea straight into the composer
        // (copy + generated image + matching accounts preselected).
        await applyIdea(ideas[0]!, 0);
        toast("Auto-pilot: top idea loaded - review and hit Publish", "success");
      }
    } catch {
      toast("Could not generate viral ideas", "error");
    } finally {
      setViralLoading(false);
    }
  }

  async function applyIdea(idea: ViralIdea, index: number) {
    setApplyingIdea(index);
    try {
      setContent(idea.content);
      setAiImagePrompt(idea.imagePrompt);

      // Preselect every connected account on the idea's platform.
      const matching = accounts.filter((a) => a.platform === idea.platform).map((a) => a.id);
      if (matching.length > 0) setSelected(new Set(matching));

      // Text-only formats skip image generation; everything else gets the
      // suggested image created right away so the post is one click from done.
      if (idea.format !== "text-only" && idea.imagePrompt) {
        const res = await fetch("/api/admin/marketing/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: idea.imagePrompt }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          setImageUrl(data.url);
        } else {
          toast(data.error || "Image generation failed - post text is ready anyway", "warning");
        }
      } else {
        setImageUrl("");
      }
      document.getElementById("marketing-composer")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setApplyingIdea(null);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      // Store is private-only (see /api/media/[...path]/route.ts) - upload
      // private and use the proxy URL, since blob.url 403s for anyone
      // without our Blob token (including Meta/X/LinkedIn's own fetchers).
      const blob = await upload(`marketing-media/${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/admin/marketing/upload",
      });
      setImageUrl(`${window.location.origin}/api/media/${blob.pathname}`);
      toast(
        file.type.startsWith("video/")
          ? "Video uploaded - Facebook supports it today; Instagram/LinkedIn/X video is coming"
          : "Uploaded",
        "success"
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function parseSlides() {
    return slidesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [heading, ...rest] = line.split("|");
        return { heading: (heading ?? "").trim(), body: rest.join("|").trim() || undefined };
      });
  }

  async function handleDownloadPdf() {
    const slides = parseSlides();
    if (slides.length < 2) {
      toast("Add at least 2 slides first", "warning");
      return;
    }
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/admin/marketing/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Could not generate the PDF", "error");
        return;
      }
      const blob = await res.blob();
      triggerBlobDownload(blob, "verlin-labs-slides.pdf");
    } catch {
      toast("Could not generate the PDF", "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDownloadCarousel() {
    const urls = carouselUrlsText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) {
      toast("Add image URLs first", "warning");
      return;
    }
    setDownloadingCarousel(true);
    try {
      const zip = new JSZip();
      let count = 0;
      await Promise.all(
        urls.map(async (url, i) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const blob = await res.blob();
            const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
            zip.file(`image-${i + 1}.${ext}`, blob);
            count += 1;
          } catch {
            // Best-effort - a third-party URL with no CORS headers will fail
            // to fetch client-side; skip it rather than aborting the whole zip.
          }
        })
      );
      if (count === 0) {
        toast("Could not download any of those images", "error");
        return;
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(zipBlob, "verlin-labs-carousel.zip");
      toast(
        count < urls.length ? `Downloaded ${count} of ${urls.length} images` : "Downloaded",
        count < urls.length ? "warning" : "success"
      );
    } catch {
      toast("Could not build the ZIP", "error");
    } finally {
      setDownloadingCarousel(false);
    }
  }

  async function handleCancelScheduled(id: string) {
    setCancelingId(id);
    try {
      const res = await fetch(`/api/admin/marketing/scheduled?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Scheduled post cancelled", "success");
      void load();
    } catch {
      toast("Could not cancel", "error");
    } finally {
      setCancelingId(null);
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
      {/* Page header - identity + at-a-glance stats, like a standalone product dashboard */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-navy text-white shadow-sm"
            aria-hidden="true"
          >
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Marketing Board</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              One place to plan, publish, and grow across every channel - no third-party vendor in between.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs">
            <Link2 className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
            <span className="font-semibold text-foreground">{accounts.length}</span>
            <span className="text-text-secondary">connected</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span className="font-semibold text-foreground">{scheduledPosts.length}</span>
            <span className="text-text-secondary">scheduled</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span className="font-semibold text-foreground">{rows.length}</span>
            <span className="text-text-secondary">published</span>
          </div>
          {totalReach > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
              <span className="font-semibold text-foreground">{totalReach.toLocaleString()}</span>
              <span className="text-text-secondary">reach</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TARGET_PLATFORMS.map((platform) => {
          const meta = platformMeta(platform);
          const connectedAccounts = accountsByPlatform.get(platform) ?? [];
          const { configured, href: connectHref } = platformConnect[platform];
          const isConnected = connectedAccounts.length > 0;

          return (
            <Card key={platform} hover className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${meta.gradient}`}
                  aria-hidden="true"
                >
                  {meta.letter}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                      isConnected ? "bg-emerald-500" : "bg-muted-foreground/50"
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{meta.label}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {isConnected
                      ? `${connectedAccounts.length} connected`
                      : configured
                        ? "Not connected"
                        : "Not set up yet"}
                  </p>
                </div>
              </div>

              {isSuperAdmin && (
                <a href={configured ? connectHref : undefined} className="mt-3 block">
                  <Button variant="secondary" size="sm" disabled={!configured} className="w-full">
                    <Link2 className="h-3.5 w-3.5" /> Connect
                  </Button>
                </a>
              )}

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

      {/* Email Suite - 5th channel, lives on its own page (inbox/leads/campaigns need more room) */}
      <Card hover className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-sm"
            aria-hidden="true"
          >
            @
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Email Suite</p>
            <p className="text-xs text-text-secondary">
              Inbox with AI triage, lead capture, and campaign sends - the 5th channel
            </p>
          </div>
        </div>
        <a href="/admin/marketing/email" className="shrink-0">
          <Button variant="secondary" size="sm">
            Open Email Suite
          </Button>
        </a>
      </Card>

      {!metaConfigured && !linkedinConfigured && !xConfigured && (
        <Card className="flex items-start gap-4 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">No platforms configured yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              This board talks directly to Meta, LinkedIn, and X - no third-party vendor in between.
              Set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">META_APP_ID</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">META_APP_SECRET</code> for
              Instagram and Facebook,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">LINKEDIN_ORG_CLIENT_ID</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">LINKEDIN_ORG_CLIENT_SECRET</code>{" "}
              for LinkedIn, and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">X_CLIENT_ID</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">X_CLIENT_SECRET</code> for X,
              then a super admin can connect each account above.
            </p>
          </div>
        </Card>
      )}

      {/* Section tabs - keeps the board from being one long scroll */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:inline-flex">
        {(
          [
            { key: "create", label: "Create", icon: Sparkles, count: 0 },
            { key: "scheduled", label: "Scheduled", icon: CalendarClock, count: scheduledPosts.length },
            { key: "performance", label: "Performance", icon: BarChart3, count: rows.length },
            { key: "growth", label: "Growth", icon: TrendingUp, count: 0 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-teal/15 text-teal" : "bg-muted text-text-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "create" && (
        <>
      {/* Viral ideas */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">Viral ideas</h2>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          AI scans this week&apos;s AI news (or your topic) and proposes the most viral-worthy post per
          platform - hook, copy, hashtags, image style, and format - scored for reach.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={viralTopic}
              onChange={(e) => setViralTopic(e.target.value)}
              placeholder="Topic (optional - leave empty to auto-pick from this week's AI news)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
            />
            <Button variant="cta" size="sm" loading={viralLoading} onClick={handleGenerateViral}>
              <Flame className="h-3.5 w-3.5" /> Find viral angles
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TARGET_PLATFORMS.map((platform) => {
              const active = viralPlatforms.has(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    setViralPlatforms((prev) => {
                      const next = new Set(prev);
                      if (next.has(platform)) next.delete(platform);
                      else next.add(platform);
                      return next.size === 0 ? new Set(TARGET_PLATFORMS) : next;
                    })
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                      : "border-border text-text-secondary hover:bg-muted"
                  }`}
                >
                  <PlatformBadge platform={platform} />
                  {platformMeta(platform).label}
                </button>
              );
            })}
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={autoPilot}
                onChange={(e) => setAutoPilot(e.target.checked)}
                className="h-3.5 w-3.5 accent-teal"
              />
              Auto-pilot: load the top idea into the composer automatically
            </label>
          </div>

          {viralIdeas.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {viralIdeas.map((idea, i) => (
                <div key={`${idea.platform}-${i}`} className="flex flex-col rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={idea.platform} />
                      <span className="text-sm font-semibold text-foreground">
                        {platformMeta(idea.platform).label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-text-secondary">
                        {FORMAT_LABELS[idea.format]}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        idea.viralityScore >= 70
                          ? "bg-orange-500/15 text-orange-600"
                          : idea.viralityScore >= 40
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-muted text-text-secondary"
                      }`}
                      title="Estimated virality"
                    >
                      {idea.viralityScore}
                    </span>
                  </div>

                  {idea.hook && <p className="mt-3 font-semibold text-foreground">{idea.hook}</p>}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{idea.content}</p>

                  {idea.hashtags.length > 0 && (
                    <p className="mt-2 text-xs text-teal">{idea.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
                  )}

                  <div className="mt-3 space-y-1 text-xs text-text-secondary">
                    {idea.imageStyle && (
                      <p>
                        <span className="font-medium text-foreground">Image:</span> {idea.imageStyle}
                      </p>
                    )}
                    {idea.rationale && (
                      <p>
                        <span className="font-medium text-foreground">Why it spreads:</span> {idea.rationale}
                      </p>
                    )}
                    {idea.bestTimeHint && (
                      <p>
                        <span className="font-medium text-foreground">Best time:</span> {idea.bestTimeHint}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={applyingIdea === i}
                      onClick={() => applyIdea(idea, i)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Use this (copy + image + accounts)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Composer */}
      <Card className="p-6" id="marketing-composer">
        <h2 className="text-lg font-semibold text-foreground">Compose</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Write once, choose where it goes, publish everywhere in one click.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-teal/40 bg-teal/5 p-3 sm:flex-row sm:items-center">
            <Sparkles className="hidden h-4 w-4 shrink-0 text-teal sm:block" aria-hidden="true" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAiCompose();
                }
              }}
              placeholder="Tell AI what to post about..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
            />
            <Button variant="secondary" size="sm" loading={aiWriting} onClick={handleAiCompose}>
              <Sparkles className="h-3.5 w-3.5" /> Write with AI
            </Button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="What do you want to share?"
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Media URL (image required for Instagram; or upload your own below)"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" /> Upload image / video
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-teal/40 bg-teal/5 p-3 sm:flex-row sm:items-center">
            <ImagePlus className="hidden h-4 w-4 shrink-0 text-teal sm:block" aria-hidden="true" />
            <input
              type="text"
              value={aiImagePrompt}
              onChange={(e) => setAiImagePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAiImage();
                }
              }}
              placeholder="Describe an image for AI to generate..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
            />
            <Button variant="secondary" size="sm" loading={aiImageGenerating} onClick={handleAiImage}>
              <ImagePlus className="h-3.5 w-3.5" /> Generate with AI
            </Button>
          </div>
          {imageUrl && (
            <div className="overflow-hidden rounded-lg border border-border bg-muted">
              {/\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(imageUrl) ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption -- ad-hoc preview of the admin's own upload
                <video src={imageUrl} controls className="max-h-56 w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary/dynamic image URL, not a static local asset
                <img src={imageUrl} alt="Post media preview" className="max-h-56 w-full object-contain" />
              )}
              <div className="flex items-center justify-end border-t border-border/60 bg-card/60 px-3 py-1.5">
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                </a>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["single", "Single image / video"],
                  ["carousel", "Carousel (IG / FB)"],
                  ["pdf-slides", "PDF slides (LinkedIn)"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setContentMode(mode)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    contentMode === mode
                      ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                      : "border-border text-text-secondary hover:bg-muted"
                  }`}
                >
                  {mode === "carousel" && <Layers className="h-3 w-3" aria-hidden="true" />}
                  {label}
                </button>
              ))}
            </div>

            {contentMode === "carousel" && (
              <div className="mt-3">
                <textarea
                  value={carouselUrlsText}
                  onChange={(e) => setCarouselUrlsText(e.target.value)}
                  rows={4}
                  placeholder={"One image URL per line (2-10 images)\nhttps://...\nhttps://..."}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-secondary">
                    Publishes as a native multi-image carousel on Instagram and Facebook. LinkedIn and X post
                    the first image only.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={downloadingCarousel}
                    onClick={handleDownloadCarousel}
                  >
                    <Download className="h-3.5 w-3.5" /> Download all (ZIP)
                  </Button>
                </div>
              </div>
            )}

            {contentMode === "pdf-slides" && (
              <div className="mt-3">
                <textarea
                  value={slidesText}
                  onChange={(e) => setSlidesText(e.target.value)}
                  rows={5}
                  placeholder={"One slide per line: Heading | Optional body text\nWhy most AI advice is wrong | Most tips assume you already understand the model\n..."}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-secondary">
                    Compiles a swipeable PDF document post for LinkedIn (2026&apos;s top-performing organic
                    format). Other platforms fall back to the text content above.
                  </p>
                  <Button variant="secondary" size="sm" loading={downloadingPdf} onClick={handleDownloadPdf}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </div>

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
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="cta" size="lg" loading={publishing} onClick={handlePublish}>
              {scheduledAt ? (
                <>
                  <CalendarClock className="h-4 w-4" /> Schedule post
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Publish now
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
                aria-label="Schedule for later (optional)"
              />
              {scheduledAt && (
                <button
                  type="button"
                  onClick={() => setScheduledAt("")}
                  className="text-xs text-text-secondary hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

        </>
      )}

      {/* Scheduled queue */}
      {activeTab === "scheduled" && scheduledPosts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Scheduled</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Queued posts publish automatically at their scheduled time - no need to keep this page open.
          </p>
          <ul className="mt-4 divide-y divide-border/60">
            {scheduledPosts.map((sp) => {
              const spAccounts = sp.accountIds
                .map((id) => accounts.find((a) => a.id === id))
                .filter((a): a is PublicAccount => Boolean(a));
              return (
                <li key={sp.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{sp.content}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <span className="font-medium text-teal">
                        {new Date(sp.scheduledAt).toLocaleString()}
                      </span>
                      <span className="flex gap-1">
                        {spAccounts.map((a) => (
                          <PlatformBadge key={a.id} platform={a.platform} />
                        ))}
                      </span>
                      {sp.imageUrl && <span>with image</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelScheduled(sp.id)}
                    disabled={cancelingId === sp.id}
                    className="shrink-0 text-text-secondary transition-colors hover:text-red-600"
                    aria-label="Cancel scheduled post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Per-channel performance */}
      {activeTab === "performance" && (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Performance</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Every post published through this board. Filter by channel, click a row for the full
          per-platform metric breakdown.
        </p>

        {rows.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <BarChart3 className="h-8 w-8 text-text-secondary/50" aria-hidden="true" />
            <p className="text-sm text-text-secondary">
              Nothing published yet. Once you publish a post above, it will show up here with its
              performance.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {["all", ...TARGET_PLATFORMS].map((p) => {
                const active = perfFilter === p;
                const count =
                  p === "all"
                    ? rows.length
                    : rows.filter((r) => r.targets.some((t) => t.platform === p)).length;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPerfFilter(p)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy"
                        : "border-border text-text-secondary hover:bg-muted"
                    }`}
                  >
                    {p === "all" ? "All channels" : platformMeta(p).label}
                    <span className={active ? "opacity-80" : "text-text-muted"}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                    <th className="pb-2 pr-4 font-medium">Post</th>
                    <th className="pb-2 pr-4 font-medium">Platforms</th>
                    <th className="pb-2 pr-4 font-medium">Reach</th>
                    <th className="pb-2 pr-4 font-medium">Engagement</th>
                    <th className="pb-2 pr-4 font-medium">Published</th>
                    <th className="pb-2 font-medium" aria-label="Details" />
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter(
                      ({ targets }) =>
                        perfFilter === "all" || targets.some((t) => t.platform === perfFilter)
                    )
                    .map(({ post, targets }) => {
                      const visibleTargets =
                        perfFilter === "all"
                          ? targets
                          : targets.filter((t) => t.platform === perfFilter);
                      const reach = visibleTargets.reduce(
                        (sum, t) => sum + (t.analytics?.reach ?? t.analytics?.impressions ?? 0),
                        0
                      );
                      const engagement = visibleTargets.reduce(
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
                      const hasAnyData = visibleTargets.some((t) => t.analytics);
                      const expanded = expandedPostId === post.id;

                      return (
                        <Fragment key={post.id}>
                          <tr
                            className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40"
                            onClick={() => setExpandedPostId(expanded ? null : post.id)}
                          >
                            <td className="max-w-xs truncate py-3 pr-4 text-foreground">{post.content}</td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-1">
                                {visibleTargets.map((t, i) => (
                                  <span key={i} title={t.status === "failed" ? "Failed to publish" : undefined}>
                                    <PlatformBadge platform={t.platform} />
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-text-secondary">{hasAnyData ? reach : "No data yet"}</td>
                            <td className="py-3 pr-4 text-text-secondary">{hasAnyData ? engagement : "No data yet"}</td>
                            <td className="py-3 pr-4 text-text-secondary">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-text-secondary">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="border-b border-border/60 bg-muted/30">
                              <td colSpan={6} className="px-2 py-4">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  {targets.map((t, i) => (
                                    <div key={i} className="rounded-lg border border-border bg-background p-3">
                                      <div className="flex items-center gap-2">
                                        <PlatformBadge platform={t.platform} />
                                        <span className="text-sm font-semibold text-foreground">
                                          {platformMeta(t.platform).label}
                                        </span>
                                        <span
                                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            t.status === "published"
                                              ? "bg-teal/15 text-teal"
                                              : "bg-red-500/15 text-red-600"
                                          }`}
                                        >
                                          {t.status}
                                        </span>
                                      </div>
                                      {t.analytics && Object.keys(t.analytics).length > 0 ? (
                                        <dl className="mt-2 space-y-1">
                                          {Object.entries(t.analytics).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-xs">
                                              <dt className="capitalize text-text-secondary">
                                                {key.replaceAll("_", " ")}
                                              </dt>
                                              <dd className="font-medium text-foreground">{value}</dd>
                                            </div>
                                          ))}
                                        </dl>
                                      ) : (
                                        <p className="mt-2 text-xs text-text-secondary">
                                          {t.status === "published"
                                            ? "No analytics reported yet - check back soon"
                                            : "Not published on this platform"}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
      )}

      {activeTab === "growth" && <GrowthAdvisor />}
    </div>
  );
}
