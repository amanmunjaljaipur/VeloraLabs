"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  Check,
  Clapperboard,
  Coins,
  Film,
  FolderCog,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ---------- Local types (mirror the server, kept client-side only) ---------- */

type TabId = "create" | "jobs" | "usage" | "profiles" | "settings";
type QualityTier = "standard" | "high" | "best";
type JobMode = "single" | "long_form";
type JobStatus =
  | "queued"
  | "moderating"
  | "generating_voice"
  | "generating_avatar"
  | "qa_check"
  | "complete"
  | "failed"
  | "rejected";
type ConsentType = "voice_face_clone" | "training_data";

interface Category {
  id: string;
  label: string;
  promptGuidance: string;
  moderationLevel: "standard" | "elevated";
  isDefault?: boolean;
}

interface ModelEntry {
  id: string;
  kind: "voice" | "avatar";
  label: string;
  tokenCostPerMinute: Record<QualityTier, number>;
  freeTierFallback: boolean;
  licenseNote: string;
  maxClipSeconds?: number;
}

interface StorageRef {
  provider: "blob" | "google_drive";
  url: string;
}

interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  dirty: boolean;
}

interface LongFormSegmentState {
  index: number;
  text: string;
  status: "pending" | "generating_voice" | "generating_avatar" | "complete" | "failed";
  voiceModelIdUsed: string | null;
  avatarModelIdUsed: string | null;
  attemptedModels: string[];
  error: string | null;
}

interface AvatarJob {
  id: string;
  categoryId: string;
  script: string;
  voiceModelId: string;
  avatarModelId: string;
  qualityTier: QualityTier;
  avatarProfileId: string | null;
  status: JobStatus;
  tokensReserved: number;
  moderationNote: string | null;
  qaScore: number | null;
  qaRetryCount: number;
  outputVideo: StorageRef | null;
  transcriptSegments: TranscriptSegment[] | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  mode: JobMode;
  targetDurationMinutes: number | null;
  segments: LongFormSegmentState[] | null;
}

interface TokenBalance {
  balance: number;
  periodResetAt: string;
}

interface LedgerEntry {
  id: string;
  kind: "consume" | "refund" | "grant";
  modelId: string | null;
  tokens: number;
  timestamp: string;
  note: string | null;
}

interface CloneProfile {
  id: string;
  name: string;
  kind: "voice" | "avatar" | "both";
  status: "processing" | "ready" | "failed";
  sourceMedia: StorageRef | null;
  createdAt: string;
}

interface ConsentEntry {
  granted: boolean;
}

const TERMINAL_STATUSES = new Set<JobStatus>(["complete", "failed", "rejected"]);

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  moderating: "Moderating",
  generating_voice: "Generating voice",
  generating_avatar: "Generating avatar",
  qa_check: "Quality check",
  complete: "Complete",
  failed: "Failed",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<JobStatus, string> = {
  queued: "bg-muted text-text-secondary",
  moderating: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  generating_voice: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  generating_avatar: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  qa_check: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const CONSENT_COPY: Record<ConsentType, { title: string; description: string }> = {
  voice_face_clone: {
    title: "Voice & Face Cloning Authorization",
    description:
      "Required before uploading a voice or face sample to create a clone profile, or using one in a job. You're confirming you have the right to use this likeness/voice (your own, or someone who has given you clear authorization).",
  },
  training_data: {
    title: "Model Improvement / Training Opt-In",
    description:
      "Optional. When granted, your corrections and ratings (transcript edits, regenerate requests, thumbs up/down) may be included in future model training batches. You can withdraw at any time - this only affects future batches, not ones already run.",
  },
};

async function parseJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

export function AvatarStudioApp({ userEmail }: { userEmail: string; userName: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = searchParams.get("tab");
    return t === "jobs" || t === "usage" || t === "profiles" || t === "settings" ? t : "create";
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [consent, setConsent] = useState<Record<ConsentType, ConsentEntry> | null>(null);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [jobs, setJobs] = useState<AvatarJob[]>([]);
  const [profiles, setProfiles] = useState<CloneProfile[]>([]);
  const [driveStatus, setDriveStatus] = useState<{ configured: boolean; connected: boolean; connectedAt: string | null } | null>(null);

  const voiceModels = useMemo(() => models.filter((m) => m.kind === "voice"), [models]);
  const avatarModels = useMemo(() => models.filter((m) => m.kind === "avatar"), [models]);

  /* ---------- Composer state ---------- */
  const [categoryId, setCategoryId] = useState("");
  const [scriptSource, setScriptSource] = useState<"generate" | "paste">("generate");
  const [topic, setTopic] = useState("");
  const [rawScript, setRawScript] = useState("");
  const [script, setScript] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [jobMode, setJobMode] = useState<JobMode>("single");
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(15);
  const [voiceModelId, setVoiceModelId] = useState("");
  const [avatarModelId, setAvatarModelId] = useState("");
  const [qualityTier, setQualityTier] = useState<QualityTier>("standard");
  const [avatarProfileId, setAvatarProfileId] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  /* ---------- Jobs tab state ---------- */
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const [transcriptDraft, setTranscriptDraft] = useState<TranscriptSegment[] | null>(null);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ---------- Profiles tab state ---------- */
  const [uploadName, setUploadName] = useState("");
  const [uploadKind, setUploadKind] = useState<"voice" | "avatar" | "both">("both");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  /* ---------- Settings tab state ---------- */
  const [consentBusy, setConsentBusy] = useState<ConsentType | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/categories");
    const data = await parseJson(res);
    if (res.ok) setCategories(data.categories ?? []);
  }, []);
  const loadModels = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/models");
    const data = await parseJson(res);
    if (res.ok) setModels(data.models ?? []);
  }, []);
  const loadConsent = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/consent");
    const data = await parseJson(res);
    if (res.ok) setConsent(data.consent ?? null);
  }, []);
  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/tokens");
    const data = await parseJson(res);
    if (res.ok) {
      setTokenBalance(data.balance ?? null);
      setLedger(data.ledger ?? []);
    }
  }, []);
  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/jobs");
    const data = await parseJson(res);
    if (res.ok) setJobs(data.jobs ?? []);
  }, []);
  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/profiles");
    const data = await parseJson(res);
    if (res.ok) setProfiles(data.profiles ?? []);
  }, []);
  const loadDriveStatus = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/storage/drive/status");
    const data = await parseJson(res);
    if (res.ok) setDriveStatus(data);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoadingInitial(true);
      await Promise.all([loadCategories(), loadModels(), loadConsent(), loadTokens(), loadJobs(), loadProfiles(), loadDriveStatus()]);
      setLoadingInitial(false);
    })();
  }, [loadCategories, loadModels, loadConsent, loadTokens, loadJobs, loadProfiles, loadDriveStatus]);

  // Poll job statuses while anything is still in flight.
  useEffect(() => {
    const hasActive = jobs.some((j) => !TERMINAL_STATUSES.has(j.status));
    if (!hasActive) return;
    const interval = setInterval(() => void loadJobs(), 5000);
    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  // Default category once loaded.
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories.find((c) => c.isDefault)?.id ?? categories[0]!.id);
    }
  }, [categories, categoryId]);
  useEffect(() => {
    if (!voiceModelId && voiceModels.length > 0) setVoiceModelId(voiceModels[0]!.id);
  }, [voiceModels, voiceModelId]);
  useEffect(() => {
    if (!avatarModelId && avatarModels.length > 0) setAvatarModelId(avatarModels[0]!.id);
  }, [avatarModels, avatarModelId]);

  // Drive OAuth redirect feedback.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "drive") {
      toast("Google Drive connected", "success");
      void loadDriveStatus();
    }
    if (error) toast(`Drive connection issue: ${error.replace(/_/g, " ")}`, "error");
    if (connected || error) router.replace("/avatar-studio?tab=settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (selectedJob?.transcriptSegments) setTranscriptDraft(selectedJob.transcriptSegments);
    else setTranscriptDraft(null);
  }, [selectedJob]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    router.replace(`/avatar-studio?tab=${tab}`);
  }

  /* ---------- Composer handlers ---------- */

  async function handleGenerateScript() {
    if (!categoryId) return;
    setGeneratingScript(true);
    setComposerError(null);
    try {
      const body: Record<string, unknown> =
        scriptSource === "paste" ? { categoryId, rawScript } : { categoryId, topic, targetDurationMinutes: jobMode === "long_form" ? targetDurationMinutes : undefined };
      const res = await fetch("/api/avatar-studio/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not generate a script", "error");
        return;
      }
      setScript(data.draft.script);
      toast("Draft ready - review and edit before creating a job", "success");
    } catch {
      toast("Could not generate a script", "error");
    } finally {
      setGeneratingScript(false);
    }
  }

  async function handleCreateJob() {
    if (!script.trim() || !categoryId || !voiceModelId || !avatarModelId) {
      setComposerError("Fill in a category, script, and both models before creating a job.");
      return;
    }
    setCreatingJob(true);
    setComposerError(null);
    try {
      const res = await fetch("/api/avatar-studio/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          script,
          voiceModelId,
          avatarModelId,
          qualityTier,
          avatarProfileId: avatarProfileId || undefined,
          mode: jobMode,
          targetDurationMinutes: jobMode === "long_form" ? targetDurationMinutes : undefined,
        }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        if (res.status === 422 && data.error === "moderation_rejected") {
          setComposerError(`This script was flagged and can't be rendered: ${data.reason ?? "policy violation"}`);
        } else if (res.status === 402) {
          setComposerError(`${data.error} ${data.fallback ? "A free-tier model pair is available if you want to switch." : ""}`);
        } else if (res.status === 403 && data.error === "consent_required") {
          setComposerError("Using a clone profile requires Voice/Face Cloning consent - grant it in Settings first.");
        } else {
          setComposerError(data.error || "Could not create the job");
        }
        return;
      }
      toast(jobMode === "long_form" ? "Long-form job queued - it renders in bursts, check the Jobs tab for progress" : "Job queued", "success");
      setScript("");
      setTopic("");
      setRawScript("");
      void loadJobs();
      void loadTokens();
      switchTab("jobs");
    } catch {
      setComposerError("Could not create the job");
    } finally {
      setCreatingJob(false);
    }
  }

  /* ---------- Jobs handlers ---------- */

  async function handleCancelJob(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/avatar-studio/jobs/${id}/cancel`, { method: "POST" });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not cancel the job", "error");
        return;
      }
      toast("Job cancelled, tokens refunded", "success");
      void loadJobs();
      void loadTokens();
    } catch {
      toast("Could not cancel the job", "error");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleSaveTranscript() {
    if (!selectedJob || !transcriptDraft) return;
    setSavingTranscript(true);
    try {
      const res = await fetch(`/api/avatar-studio/jobs/${selectedJob.id}/transcript`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: transcriptDraft }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not save the transcript", "error");
        return;
      }
      toast("Transcript saved", "success");
      void loadJobs();
    } catch {
      toast("Could not save the transcript", "error");
    } finally {
      setSavingTranscript(false);
    }
  }

  async function handleQuickFeedback(job: AvatarJob, type: "thumbs_up" | "thumbs_down") {
    try {
      await fetch(`/api/avatar-studio/jobs/${job.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctionType: type }),
      });
      toast("Thanks - feedback recorded", "success");
    } catch {
      toast("Could not record feedback", "error");
    }
  }

  /* ---------- Profiles handlers ---------- */

  async function handleUploadProfile() {
    if (!uploadFile || !uploadName.trim()) {
      toast("Add a name and choose a file first", "error");
      return;
    }
    setUploadingProfile(true);
    try {
      const form = new FormData();
      form.set("file", uploadFile);
      form.set("name", uploadName.trim());
      form.set("kind", uploadKind);
      const res = await fetch("/api/avatar-studio/profiles", { method: "POST", body: form });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not upload the sample", "error");
        return;
      }
      toast("Sample uploaded", "success");
      setUploadName("");
      setUploadFile(null);
      void loadProfiles();
    } catch {
      toast("Could not upload the sample", "error");
    } finally {
      setUploadingProfile(false);
    }
  }

  async function handleDeleteProfile(id: string) {
    if (!window.confirm("Delete this clone profile?")) return;
    try {
      const res = await fetch(`/api/avatar-studio/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Could not delete the profile", "error");
        return;
      }
      toast("Profile deleted", "success");
      void loadProfiles();
    } catch {
      toast("Could not delete the profile", "error");
    }
  }

  /* ---------- Settings handlers ---------- */

  async function handleConsentToggle(type: ConsentType, action: "grant" | "withdraw") {
    setConsentBusy(type);
    try {
      const res = await fetch("/api/avatar-studio/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not update consent", "error");
        return;
      }
      toast(action === "grant" ? "Consent granted" : "Consent withdrawn", "success");
      void loadConsent();
    } catch {
      toast("Could not update consent", "error");
    } finally {
      setConsentBusy(null);
    }
  }

  async function handleDisconnectDrive() {
    if (!window.confirm("Disconnect Google Drive? New uploads will go to standard storage instead.")) return;
    try {
      await fetch("/api/avatar-studio/storage/drive/disconnect", { method: "POST" });
      toast("Google Drive disconnected", "success");
      void loadDriveStatus();
    } catch {
      toast("Could not disconnect Drive", "error");
    }
  }

  const hasCloneConsent = consent?.voice_face_clone?.granted ?? false;
  const hasTrainingConsent = consent?.training_data?.granted ?? false;

  const tabs: { id: TabId; label: string; icon: typeof Clapperboard }[] = [
    { id: "create", label: "Create", icon: Sparkles },
    { id: "jobs", label: "Jobs", icon: Film },
    { id: "usage", label: "Usage", icon: Coins },
    { id: "profiles", label: "Profiles", icon: Video },
    { id: "settings", label: "Settings", icon: FolderCog },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white dark:bg-white dark:text-navy">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Avatar Studio</h1>
            <p className="text-sm text-text-secondary">Script to AI avatar video - single clips or long-form, chained and stitched.</p>
            <p className="text-xs text-text-secondary/70">Signed in as {userEmail}</p>
          </div>
        </div>
        <Card className="flex items-center gap-3 !p-3">
          <Coins className="h-5 w-5 text-accent-teal" />
          <div>
            <p className="text-xs text-text-secondary">Token balance</p>
            <p className="text-lg font-semibold text-foreground">{tokenBalance ? tokenBalance.balance : "-"}</p>
          </div>
        </Card>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-navy text-white dark:bg-white dark:text-navy" : "text-text-secondary hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loadingInitial ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
        </div>
      ) : (
        <>
          {activeTab === "create" && (
            <div className="grid gap-6 md:grid-cols-[1fr_320px]">
              <Card className="space-y-5">
                <div>
                  <Select
                    label="Category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    options={categories.map((c) => ({ value: c.id, label: c.label }))}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJobMode("single")}
                    className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      jobMode === "single" ? "border-accent-teal bg-accent-teal/10" : "border-border"
                    }`}
                  >
                    <p className="font-medium text-foreground">Single clip</p>
                    <p className="text-xs text-text-secondary">One short video from your script</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobMode("long_form")}
                    className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      jobMode === "long_form" ? "border-accent-teal bg-accent-teal/10" : "border-border"
                    }`}
                  >
                    <p className="font-medium text-foreground">Long-form (up to 30 min)</p>
                    <p className="text-xs text-text-secondary">Chains many short clips into one long video</p>
                  </button>
                </div>

                {jobMode === "long_form" && (
                  <Input
                    label="Target length (minutes)"
                    type="number"
                    min={1}
                    max={30}
                    value={targetDurationMinutes}
                    onChange={(e) => setTargetDurationMinutes(Number(e.target.value) || 1)}
                  />
                )}

                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setScriptSource("generate")}
                    className={`rounded-full border px-3.5 py-1.5 font-medium ${scriptSource === "generate" ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : "border-border text-text-secondary"}`}
                  >
                    Generate from a topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setScriptSource("paste")}
                    className={`rounded-full border px-3.5 py-1.5 font-medium ${scriptSource === "paste" ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : "border-border text-text-secondary"}`}
                  >
                    Paste my own script
                  </button>
                </div>

                {scriptSource === "generate" ? (
                  <Input label="Topic / prompt" placeholder="e.g. why async/await beats callbacks" value={topic} onChange={(e) => setTopic(e.target.value)} />
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Paste script</label>
                    <textarea
                      className="h-32 w-full rounded-xl border border-border bg-card p-4 text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
                      value={rawScript}
                      onChange={(e) => setRawScript(e.target.value)}
                    />
                  </div>
                )}

                <Button variant="secondary" onClick={handleGenerateScript} loading={generatingScript} disabled={scriptSource === "generate" && !topic.trim()}>
                  <Sparkles className="h-4 w-4" />
                  {scriptSource === "generate" ? "Generate draft" : "Use this script"}
                </Button>

                {script && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Script draft ({script.trim().split(/\s+/).filter(Boolean).length} words - review and edit before rendering)
                    </label>
                    <textarea className="h-56 w-full rounded-xl border border-border bg-card p-4 text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20" value={script} onChange={(e) => setScript(e.target.value)} />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Voice model" value={voiceModelId} onChange={(e) => setVoiceModelId(e.target.value)} options={voiceModels.map((m) => ({ value: m.id, label: `${m.label}${m.freeTierFallback ? " (free)" : ""}` }))} />
                  <Select label="Avatar model" value={avatarModelId} onChange={(e) => setAvatarModelId(e.target.value)} options={avatarModels.map((m) => ({ value: m.id, label: `${m.label}${m.freeTierFallback ? " (free)" : ""}` }))} />
                  <Select label="Quality" value={qualityTier} onChange={(e) => setQualityTier(e.target.value as QualityTier)} options={[{ value: "standard", label: "Standard" }, { value: "high", label: "High" }, { value: "best", label: "Best" }]} />
                  <Select
                    label="Clone profile (optional)"
                    value={avatarProfileId}
                    onChange={(e) => setAvatarProfileId(e.target.value)}
                    options={[{ value: "", label: "None - use stock model" }, ...profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.status})` }))]}
                    disabled={!hasCloneConsent}
                  />
                </div>
                {!hasCloneConsent && <p className="text-xs text-text-secondary">Grant Voice/Face Cloning consent in Settings to use a clone profile.</p>}

                {composerError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{composerError}</p>
                  </div>
                )}

                <Button onClick={handleCreateJob} loading={creatingJob} disabled={!script.trim()} className="w-full">
                  <Play className="h-4 w-4" />
                  Create {jobMode === "long_form" ? "long-form " : ""}job
                </Button>
              </Card>

              <div className="space-y-4">
                <Card>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">How this works</h3>
                  <p className="text-sm text-text-secondary">
                    Your script is moderated before anything renders. Long-form videos are split into clip-sized
                    segments, chained by feeding each clip&apos;s last frame into the next, then stitched together. If a
                    model runs out of free quota mid-job, the next available model is tried automatically.
                  </p>
                </Card>
                {tokenBalance && (
                  <Card>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">This month</h3>
                    <p className="text-2xl font-semibold text-foreground">{tokenBalance.balance} tokens</p>
                    <p className="text-xs text-text-secondary">Resets {new Date(tokenBalance.periodResetAt).toLocaleDateString()}</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="grid gap-6 md:grid-cols-[380px_1fr]">
              <div className="space-y-3">
                {jobs.length === 0 && <EmptyBlock text="No jobs yet - create one from the Create tab." />}
                {jobs.map((job) => (
                  <Card key={job.id} hover onClick={() => setSelectedJobId(job.id)} className={`cursor-pointer !p-4 ${selectedJobId === job.id ? "ring-2 ring-accent-teal" : ""}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge className={STATUS_COLOR[job.status]}>{STATUS_LABEL[job.status]}</Badge>
                      {job.mode === "long_form" && <Badge>Long-form</Badge>}
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground">{job.script.slice(0, 140)}</p>
                    {job.mode === "long_form" && job.segments && (
                      <p className="mt-2 text-xs text-text-secondary">
                        {job.segments.filter((s) => s.status === "complete").length}/{job.segments.length} segments
                      </p>
                    )}
                    <p className="mt-2 text-xs text-text-secondary">{new Date(job.createdAt).toLocaleString()}</p>
                  </Card>
                ))}
              </div>

              <div>
                {!selectedJob ? (
                  <EmptyBlock text="Select a job to see details." />
                ) : (
                  <Card className="space-y-5">
                    <div className="flex items-center justify-between">
                      <Badge className={STATUS_COLOR[selectedJob.status]}>{STATUS_LABEL[selectedJob.status]}</Badge>
                      {!TERMINAL_STATUSES.has(selectedJob.status) && (
                        <Button variant="secondary" size="sm" loading={cancellingId === selectedJob.id} onClick={() => handleCancelJob(selectedJob.id)}>
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}
                    </div>

                    {selectedJob.error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {selectedJob.error}
                      </div>
                    )}

                    <div>
                      <h4 className="mb-1 text-sm font-semibold text-foreground">Script</h4>
                      <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm text-text-secondary">{selectedJob.script}</p>
                    </div>

                    {selectedJob.mode === "long_form" && selectedJob.segments && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">
                          Segments ({selectedJob.segments.filter((s) => s.status === "complete").length}/{selectedJob.segments.length})
                        </h4>
                        <div className="max-h-48 space-y-1 overflow-y-auto">
                          {selectedJob.segments.map((seg) => (
                            <div key={seg.index} className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs">
                              <span className="text-text-secondary">#{seg.index + 1} - {seg.text.slice(0, 50)}...</span>
                              <span className={seg.status === "complete" ? "text-emerald-600" : seg.status === "failed" ? "text-red-600" : "text-text-secondary"}>
                                {seg.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedJob.outputVideo && (
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Output</h4>
                        <video controls className="w-full rounded-xl bg-black" src={selectedJob.outputVideo.url} />
                        <a href={selectedJob.outputVideo.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent-teal hover:underline">
                          Open video directly
                        </a>
                      </div>
                    )}

                    {selectedJob.status === "complete" && (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleQuickFeedback(selectedJob, "thumbs_up")}>
                          <Check className="h-3.5 w-3.5" /> Good
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleQuickFeedback(selectedJob, "thumbs_down")}>
                          <X className="h-3.5 w-3.5" /> Not quite
                        </Button>
                      </div>
                    )}

                    {selectedJob.status === "complete" && transcriptDraft && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Transcript</h4>
                        <div className="max-h-64 space-y-2 overflow-y-auto">
                          {transcriptDraft.map((seg, idx) => (
                            <textarea
                              key={seg.id}
                              value={seg.text}
                              onChange={(e) => {
                                const next = [...transcriptDraft];
                                next[idx] = { ...seg, text: e.target.value, dirty: e.target.value !== selectedJob.transcriptSegments?.[idx]?.text };
                                setTranscriptDraft(next);
                              }}
                              className="w-full rounded-lg border border-border bg-card p-2 text-sm text-foreground focus:border-accent-teal focus:outline-none"
                              rows={2}
                            />
                          ))}
                        </div>
                        <Button size="sm" className="mt-2" loading={savingTranscript} onClick={handleSaveTranscript}>
                          Save transcript edits
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Current balance</p>
                    <p className="text-3xl font-semibold text-foreground">{tokenBalance?.balance ?? "-"} tokens</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void loadTokens()}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
                {tokenBalance && <p className="mt-2 text-xs text-text-secondary">Free-tier allowance resets {new Date(tokenBalance.periodResetAt).toLocaleDateString()}</p>}
              </Card>

              <Card>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h3>
                {ledger.length === 0 ? (
                  <p className="text-sm text-text-secondary">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {ledger.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                        <div>
                          <span className="font-medium capitalize text-foreground">{entry.kind}</span>
                          {entry.modelId && <span className="ml-2 text-text-secondary">{entry.modelId}</span>}
                          {entry.note && <p className="text-xs text-text-secondary">{entry.note}</p>}
                        </div>
                        <div className="text-right">
                          <p className={entry.kind === "consume" ? "text-red-600" : "text-emerald-600"}>
                            {entry.kind === "consume" ? "-" : "+"}
                            {entry.tokens}
                          </p>
                          <p className="text-xs text-text-secondary">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "profiles" && (
            <div className="grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {profiles.length === 0 && <EmptyBlock text="No clone profiles yet." />}
                {profiles.map((p) => (
                  <Card key={p.id} className="flex items-center justify-between !p-4">
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-text-secondary capitalize">{p.kind} - {p.status}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleDeleteProfile(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
              <Card className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Add a clone profile</h3>
                {!hasCloneConsent ? (
                  <p className="text-sm text-text-secondary">Grant Voice/Face Cloning consent in Settings before uploading a sample.</p>
                ) : (
                  <>
                    <Input label="Name" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
                    <Select label="Type" value={uploadKind} onChange={(e) => setUploadKind(e.target.value as "voice" | "avatar" | "both")} options={[{ value: "both", label: "Voice + Face" }, { value: "voice", label: "Voice only" }, { value: "avatar", label: "Face only" }]} />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Sample (audio or video)</label>
                      <input type="file" accept="audio/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="text-sm text-text-secondary" />
                    </div>
                    <Button onClick={handleUploadProfile} loading={uploadingProfile} className="w-full">
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  </>
                )}
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4" /> Consent
                </h3>
                <div className="space-y-4">
                  {(Object.keys(CONSENT_COPY) as ConsentType[]).map((type) => {
                    const granted = consent?.[type]?.granted ?? false;
                    return (
                      <div key={type} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{CONSENT_COPY[type].title}</p>
                            <p className="mt-1 text-sm text-text-secondary">{CONSENT_COPY[type].description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={granted ? "secondary" : "primary"}
                            loading={consentBusy === type}
                            onClick={() => handleConsentToggle(type, granted ? "withdraw" : "grant")}
                          >
                            {granted ? "Withdraw" : "Grant"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FolderCog className="h-4 w-4" /> Storage
                </h3>
                {!driveStatus?.configured ? (
                  <p className="text-sm text-text-secondary">Google Drive isn&apos;t configured on this deployment yet.</p>
                ) : driveStatus.connected ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground">Connected {driveStatus.connectedAt ? `since ${new Date(driveStatus.connectedAt).toLocaleDateString()}` : ""}</p>
                    <Button variant="secondary" size="sm" onClick={handleDisconnectDrive}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Connect your Google Drive so large generated videos use your own storage instead of the shared pool.</p>
                    <a href="/api/avatar-studio/storage/drive/connect">
                      <Button size="sm">Connect Drive</Button>
                    </a>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <Card className="flex items-center justify-center py-12 text-center">
      <p className="text-sm text-text-secondary">{text}</p>
    </Card>
  );
}
