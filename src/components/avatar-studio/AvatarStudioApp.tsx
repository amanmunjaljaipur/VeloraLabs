"use client";

/**
 * Avatar Studio product UI — designed with `.grok/skills/avatar-studio-design`
 * (shadcn composition on Verlin UI kit + AI-native agent status patterns).
 */

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { TrainCapturePanel } from "@/components/avatar-studio/TrainCapturePanel";
import { SyncedMediaPlayer } from "@/components/avatar-studio/SyncedMediaPlayer";
import { DriveConnectorCard } from "@/components/avatar-studio/DriveConnectorCard";
import {
  StudioHero,
  StudioJourneyStrip,
  StudioStepVisual,
  StudioVisualTip,
} from "@/components/avatar-studio/StudioVisualChrome";
import {
  MemeSuggestPanel,
  type SelectedMemeForJob,
} from "@/components/avatar-studio/MemeSuggestPanel";
import { ChangeVoiceModal } from "@/components/avatar-studio/ChangeVoiceModal";
import {
  FacePickerList,
  FreeVoiceList,
  TrainedVoiceList,
} from "@/components/avatar-studio/VoiceCharacterPicker";
import { MotionReveal } from "@/components/ui/MotionReveal";
import {
  DEFAULT_FREE_VOICE_ID,
  FREE_VOICE_PRESETS,
  isFreeVoiceId,
} from "@/lib/avatar-studio/free-voices";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Film,
  FolderCog,
  Mic,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ---------- Types ---------- */

type TabId = "create" | "train" | "videos" | "credits" | "setup";
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
type CreateStep = 1 | 2 | 3 | 4 | 5;

const FREE_FACE = "__free_face__";

interface CloneProfile {
  id: string;
  name: string;
  kind: "voice" | "avatar" | "both";
  status: "processing" | "ready" | "failed";
  sourceMedia: { provider: "blob" | "google_drive"; url: string } | null;
  mediaBank?: { id: string; url: string; kind: string; mimeType?: string }[];
  coverMediaId?: string | null;
  ttsVoiceHint?: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  label: string;
  isDefault?: boolean;
}

interface ModelEntry {
  id: string;
  kind: "voice" | "avatar";
  label: string;
  freeTierFallback: boolean;
  maxClipSeconds?: number;
}

interface StorageRef {
  provider: "blob" | "google_drive";
  url: string;
}

interface TranscriptSegment {
  id: string;
  text: string;
}

interface LongFormSegmentState {
  index: number;
  text: string;
  status: string;
  error: string | null;
}

interface AvatarJob {
  id: string;
  script: string;
  status: JobStatus;
  voiceProfileId?: string | null;
  avatarProfileId?: string | null;
  outputVideo: StorageRef | null;
  outputAudio: StorageRef | null;
  outputPoster: StorageRef | null;
  outputKind: "video" | "presenter" | null;
  progressPercent?: number;
  progressLabel?: string | null;
  transcriptSegments: TranscriptSegment[] | null;
  error: string | null;
  createdAt: string;
  mode: JobMode;
  segments: LongFormSegmentState[] | null;
}

interface TokenBalance {
  balance: number;
  periodResetAt: string;
}

interface LedgerEntry {
  id: string;
  kind: "consume" | "refund" | "grant";
  tokens: number;
  timestamp: string;
  note: string | null;
}

interface FreemiumPlan {
  monthlyTokens: number;
  freeVoice: { label: string; description: string };
  freeAvatar: { label: string; description: string; maxClipSeconds: number };
  customEndpoints: { voice: string; avatar: string };
  paidNotes: string[];
  longFormMinutesMax: number;
}

interface UserSettings {
  voiceMode: "free" | "custom_url";
  voiceEndpointUrl: string | null;
  avatarMode: "free" | "custom_url";
  avatarEndpointUrl: string | null;
  stitchMode: "free_skip" | "custom_url";
  frameExtractEndpointUrl: string | null;
  stitchEndpointUrl: string | null;
  presenterPortraitUrl: string | null;
  presenterStylePrompt: string | null;
}

const TERMINAL = new Set<JobStatus>(["complete", "failed", "rejected"]);

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  moderating: "Checking script",
  generating_voice: "Creating voice…",
  generating_avatar: "Creating video…",
  qa_check: "Quality check…",
  complete: "Ready",
  failed: "Failed",
  rejected: "Rejected",
};

const STATUS_VARIANT: Record<JobStatus, BadgeVariant> = {
  queued: "secondary",
  moderating: "warning",
  generating_voice: "info",
  generating_avatar: "info",
  qa_check: "info",
  complete: "success",
  failed: "destructive",
  rejected: "destructive",
};

const PROGRESS_BY_STATUS: Record<JobStatus, number> = {
  queued: 8,
  moderating: 12,
  generating_voice: 35,
  generating_avatar: 70,
  qa_check: 92,
  complete: 100,
  failed: 100,
  rejected: 100,
};

function jobProgressValue(job: AvatarJob): number {
  if (typeof job.progressPercent === "number" && Number.isFinite(job.progressPercent)) {
    return Math.max(0, Math.min(100, job.progressPercent));
  }
  return PROGRESS_BY_STATUS[job.status] ?? 0;
}

function jobProgressLabel(job: AvatarJob): string {
  if (job.progressLabel?.trim()) return job.progressLabel;
  return STATUS_LABEL[job.status];
}

const CONSENT_COPY: Record<ConsentType, { title: string; description: string }> = {
  voice_face_clone: {
    title: "Voice & face cloning (required for custom likeness)",
    description:
      "You confirm you have the legal right to use any voice or face sample you upload or clone. Unauthorized deepfakes or impersonation are prohibited.",
  },
  training_data: {
    title: "Help improve models (optional)",
    description:
      "Ratings and transcript corrections may be included in future training batches. Withdraw anytime; past batches stay for audit lineage.",
  },
};

async function parseJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

function hasMediaOutput(job: AvatarJob): boolean {
  if (job.outputKind === "presenter") return Boolean(job.outputAudio?.url || job.outputVideo?.url);
  return Boolean(job.outputVideo?.url || job.outputAudio?.url);
}

/** Ready to watch: completed jobs, or mid re-voice while previous media still exists. */
function hasPlayableOutput(job: AvatarJob): boolean {
  if (job.status === "complete") return hasMediaOutput(job);
  // Keep last version visible while re-voicing
  if (!TERMINAL.has(job.status) && hasMediaOutput(job)) return true;
  return false;
}

function canChangeVoice(job: AvatarJob): boolean {
  return (job.status === "complete" || job.status === "failed") && Boolean(job.script?.trim());
}

function isRealVideoFile(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("presenter-") && url.includes(".mp4");
}

function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

/* ---------- Player ---------- */

function ResultPlayer({
  job,
  onChangeVoice,
}: {
  job: AvatarJob;
  onChangeVoice?: (job: AvatarJob) => void;
}) {
  const video = job.outputVideo?.url;
  const poster = job.outputPoster?.url;
  const audio = job.outputAudio?.url;
  const hasMp4 = isRealVideoFile(video) || (job.outputKind === "video" && Boolean(video));
  const isStillFallback = !hasMp4 && Boolean(audio || poster);
  const revoicing = !TERMINAL.has(job.status) && hasMediaOutput(job);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={hasMp4 ? "success" : "secondary"}>
          {hasMp4 ? "Animated presenter · free" : "Still + audio fallback"}
        </Badge>
        {job.mode === "long_form" ? <Badge variant="outline">Long-form</Badge> : null}
        {revoicing ? <Badge variant="warning">Updating voice…</Badge> : null}
        {canChangeVoice(job) && onChangeVoice ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => onChangeVoice(job)}>
            <Mic className="size-4" />
            Change voice
          </Button>
        ) : null}
      </div>

      {hasMp4 && video ? (
        <SyncedMediaPlayer
          mode="video"
          videoUrl={video}
          posterUrl={poster}
          caption="Progress bar follows playback time. Free path: motion zoom (not GPU lip-sync)."
        />
      ) : isStillFallback ? (
        <SyncedMediaPlayer
          mode="audio"
          audioUrl={audio}
          posterUrl={poster}
          caption="Progress bar follows audio. Install/use ffmpeg for full motion MP4."
        />
      ) : (
        <Alert variant="info" title="No playable file">
          This job has no media yet.
        </Alert>
      )}

      {job.transcriptSegments && job.transcriptSegments.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-xl bg-muted p-3 text-sm text-text-secondary">
          <div className="flex flex-col gap-1">
            {job.transcriptSegments.map((s) => (
              <p key={s.id}>{s.text}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {video ? (
          <a href={video} target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">
            Open file
          </a>
        ) : null}
        {audio ? (
          <a href={audio} target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">
            Open audio
          </a>
        ) : null}
        {poster ? (
          <a href={poster} target="_blank" rel="noreferrer" className="text-accent-teal hover:underline">
            Open portrait
          </a>
        ) : null}
        {canChangeVoice(job) && onChangeVoice ? (
          <button
            type="button"
            className="font-medium text-accent-teal hover:underline"
            onClick={() => onChangeVoice(job)}
          >
            Change full voice…
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Main ---------- */

export function AvatarStudioApp({ userEmail }: { userEmail: string; userName: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = searchParams.get("tab");
    if (t === "train" || t === "profiles") return "train";
    if (t === "videos" || t === "jobs") return "videos";
    // Credits are not a primary tab — open Setup instead
    if (t === "credits" || t === "usage" || t === "setup" || t === "settings") return "setup";
    return "create";
  });

  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [consent, setConsent] = useState<Record<ConsentType, { granted: boolean }> | null>(null);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [jobs, setJobs] = useState<AvatarJob[]>([]);
  const [driveStatus, setDriveStatus] = useState<{
    configured: boolean;
    connected: boolean;
    connectedAt: string | null;
    credentialSource?: "drive_specific" | "login_shared" | "none";
    missingEnv?: string[];
    redirectUri?: string;
    connectUrl?: string;
    setupSteps?: string[];
    driveScope?: string;
  } | null>(null);
  const [freemium, setFreemium] = useState<FreemiumPlan | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  const voiceModels = useMemo(() => models.filter((m) => m.kind === "voice"), [models]);
  const avatarModels = useMemo(() => models.filter((m) => m.kind === "avatar"), [models]);
  const freeVoice = useMemo(() => voiceModels.find((m) => m.freeTierFallback) ?? voiceModels[0], [voiceModels]);
  const freeAvatar = useMemo(
    () => avatarModels.find((m) => m.freeTierFallback) ?? avatarModels[0],
    [avatarModels]
  );

  const [categoryId, setCategoryId] = useState("");
  const [scriptSource, setScriptSource] = useState<"generate" | "paste">("generate");
  const [topic, setTopic] = useState("");
  const [rawScript, setRawScript] = useState("");
  const [script, setScript] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [jobMode, setJobMode] = useState<JobMode>("single");
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(10);
  const [voiceModelId, setVoiceModelId] = useState("");
  const [avatarModelId, setAvatarModelId] = useState("");
  const [qualityTier, setQualityTier] = useState<QualityTier>("standard");
  const [creatingJob, setCreatingJob] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [memesEnabled, setMemesEnabled] = useState(false);
  const [memeSelections, setMemeSelections] = useState<SelectedMemeForJob[]>([]);
  const [videoGenre, setVideoGenre] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [viewJobId, setViewJobId] = useState<string | null>(null);

  /** Change-voice popup for an existing completed video */
  const [revoiceJobId, setRevoiceJobId] = useState<string | null>(null);
  const [revoiceBusy, setRevoiceBusy] = useState(false);
  const [revoiceError, setRevoiceError] = useState<string | null>(null);

  /** Trained samples from Train tab */
  const [profiles, setProfiles] = useState<CloneProfile[]>([]);
  /** Primary voice: free:en-US-JennyNeural or trained profile uuid */
  const [primaryVoiceId, setPrimaryVoiceId] = useState(DEFAULT_FREE_VOICE_ID);
  /** Multi-select voices in cast */
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>([DEFAULT_FREE_VOICE_ID]);
  /** Primary face/character */
  const [primaryFaceId, setPrimaryFaceId] = useState(FREE_FACE);
  /** Multi-select faces/characters */
  const [selectedFaceIds, setSelectedFaceIds] = useState<string[]>([FREE_FACE]);

  const [setupVoiceMode, setSetupVoiceMode] = useState<"free" | "custom_url">("free");
  const [setupVoiceUrl, setSetupVoiceUrl] = useState("");
  const [setupAvatarMode, setSetupAvatarMode] = useState<"free" | "custom_url">("free");
  const [setupAvatarUrl, setSetupAvatarUrl] = useState("");
  const [setupStitchMode, setSetupStitchMode] = useState<"free_skip" | "custom_url">("free_skip");
  const [setupFrameUrl, setSetupFrameUrl] = useState("");
  const [setupStitchUrl, setSetupStitchUrl] = useState("");
  const [setupPortraitUrl, setSetupPortraitUrl] = useState("");
  const [setupStylePrompt, setSetupStylePrompt] = useState("");
  const [savingSetup, setSavingSetup] = useState(false);
  const [consentBusy, setConsentBusy] = useState<ConsentType | null>(null);

  const activeJob = jobs.find((j) => j.id === activeJobId) ?? null;
  const viewJob = jobs.find((j) => j.id === viewJobId) ?? null;
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === "complete"), [jobs]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/categories");
    const data = await parseJson(res);
    if (res.ok) setCategories(data.categories ?? []);
  }, []);

  const loadModels = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/models");
    const data = await parseJson(res);
    if (res.ok) {
      setModels(data.models ?? []);
      if (data.freemium) setFreemium(data.freemium);
      if (data.settings) setUserSettings(data.settings);
    }
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

  const loadDriveStatus = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/storage/drive/status");
    const data = await parseJson(res);
    if (res.ok) setDriveStatus(data);
  }, []);

  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/profiles");
    const data = await parseJson(res);
    if (res.ok) setProfiles(data.profiles ?? []);
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/avatar-studio/settings");
    const data = await parseJson(res);
    if (!res.ok) return;
    if (data.settings) {
      setUserSettings(data.settings);
      setSetupVoiceMode(data.settings.voiceMode ?? "free");
      setSetupVoiceUrl(data.settings.voiceEndpointUrl ?? "");
      setSetupAvatarMode(data.settings.avatarMode ?? "free");
      setSetupAvatarUrl(data.settings.avatarEndpointUrl ?? "");
      setSetupStitchMode(data.settings.stitchMode ?? "free_skip");
      setSetupFrameUrl(data.settings.frameExtractEndpointUrl ?? "");
      setSetupStitchUrl(data.settings.stitchEndpointUrl ?? "");
      setSetupPortraitUrl(data.settings.presenterPortraitUrl ?? "");
      setSetupStylePrompt(data.settings.presenterStylePrompt ?? "");
    }
    if (data.freemium) setFreemium(data.freemium);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoadingInitial(true);
      await Promise.all([
        loadCategories(),
        loadModels(),
        loadConsent(),
        loadTokens(),
        loadJobs(),
        loadDriveStatus(),
        loadSettings(),
        loadProfiles(),
      ]);
      setLoadingInitial(false);
    })();
  }, [loadCategories, loadModels, loadConsent, loadTokens, loadJobs, loadDriveStatus, loadSettings, loadProfiles]);

  useEffect(() => {
    if (!jobs.some((j) => !TERMINAL.has(j.status))) return;
    // Faster poll so progress % and labels feel live during generation
    const id = setInterval(() => void loadJobs(), 1500);
    return () => clearInterval(id);
  }, [jobs, loadJobs]);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories.find((c) => c.isDefault)?.id ?? categories[0]!.id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!voiceModelId && freeVoice) setVoiceModelId(freeVoice.id);
  }, [freeVoice, voiceModelId]);

  useEffect(() => {
    if (!avatarModelId && freeAvatar) setAvatarModelId(freeAvatar.id);
  }, [freeAvatar, avatarModelId]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "drive") {
      toast("Google Drive connected — uploads will use your Drive", "success");
      void loadDriveStatus();
    }
    if (error) {
      const normalized = error.trim().toLowerCase().replace(/\s+/g, "_");
      const friendly: Record<string, string> = {
        drive_not_configured:
          "Google OAuth is not set up locally. Add real GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to .env.local (copy from Vercel Production), set AUTH_URL=http://localhost:3000, restart npm run dev.",
        drive_denied: "Google permission was denied. Click Connect with Google again and press Allow.",
        drive_no_code: "Google did not return a code. Try Connect with Google again.",
        state_mismatch: "Security check failed. Try Connect with Google again.",
        drive_token_exchange_failed:
          "Could not finish Google login. In Google Cloud, add redirect URI: /api/avatar-studio/storage/drive/callback",
        drive_no_refresh_token:
          "Google did not return offline access. Revoke the app at myaccount.google.com/permissions and connect again.",
        unauthorized: "Please sign in first, then connect Drive.",
      };
      toast(
        friendly[normalized] ?? friendly[error] ?? `Google Drive: ${error.replace(/_/g, " ")}`,
        "error"
      );
      void loadDriveStatus();
    }
    // Land on Train after Drive OAuth — that's where the connector lives.
    if (connected || error) router.replace("/avatar-studio?tab=train");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (activeJob?.status === "complete") {
      setCreateStep(5);
      setViewJobId(activeJob.id);
    }
  }, [activeJob?.status, activeJob?.id]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    // Keep scroll position — default router navigation jumps to top (useless for in-page tabs).
    router.replace(`/avatar-studio?tab=${tab}`, { scroll: false });
  }

  async function handleGenerateScript() {
    if (!categoryId) return;
    setGeneratingScript(true);
    setComposerError(null);
    try {
      const body: Record<string, unknown> =
        scriptSource === "paste"
          ? { categoryId, rawScript }
          : {
              categoryId,
              topic,
              targetDurationMinutes: jobMode === "long_form" ? targetDurationMinutes : undefined,
            };
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
      toast("Script ready — edit if needed, then continue", "success");
    } catch {
      toast("Could not generate a script", "error");
    } finally {
      setGeneratingScript(false);
    }
  }

  const voiceProfiles = useMemo(
    () => profiles.filter((p) => p.status === "ready" && (p.kind === "voice" || p.kind === "both")),
    [profiles]
  );
  const faceProfiles = useMemo(
    () => profiles.filter((p) => p.status === "ready" && (p.kind === "avatar" || p.kind === "both")),
    [profiles]
  );

  function toggleVoiceSelect(id: string) {
    setSelectedVoiceIds((prev) => {
      const has = prev.includes(id);
      if (has) {
        if (prev.length === 1) return prev; // keep at least one
        const next = prev.filter((x) => x !== id);
        if (primaryVoiceId === id) setPrimaryVoiceId(next[0]!);
        return next;
      }
      // Always make newly added voice primary so Create uses it
      setPrimaryVoiceId(id);
      return [...prev, id];
    });
  }

  function toggleFaceSelect(id: string) {
    setSelectedFaceIds((prev) => {
      const has = prev.includes(id);
      if (has) {
        if (prev.length === 1) return prev;
        const next = prev.filter((x) => x !== id);
        if (primaryFaceId === id) setPrimaryFaceId(next[0]!);
        return next;
      }
      return [...prev, id];
    });
    if (!selectedFaceIds.includes(id)) setPrimaryFaceId(id);
  }

  function configSummary() {
    let voiceLabel = "Voice";
    if (isFreeVoiceId(primaryVoiceId)) {
      const preset = FREE_VOICE_PRESETS.find((v) => v.id === primaryVoiceId);
      voiceLabel = preset
        ? `${preset.label} · ${preset.region}`
        : primaryVoiceId.replace(/^free:/, "");
    } else {
      const p = voiceProfiles.find((x) => x.id === primaryVoiceId);
      const hint = p?.ttsVoiceHint
        ? FREE_VOICE_PRESETS.find((v) => v.edgeVoice === p.ttsVoiceHint)?.label
        : null;
      voiceLabel = p
        ? `${p.name}${hint ? ` → ${hint}` : ""}`
        : "Voice sample";
    }
    const faceLabel =
      primaryFaceId === FREE_FACE
        ? "Auto portrait"
        : faceProfiles.find((p) => p.id === primaryFaceId)?.name ?? "Face sample";
    return { voiceLabel, faceLabel };
  }

  async function handleCreateJob() {
    if (!script.trim() || !categoryId || !voiceModelId || !avatarModelId) {
      setComposerError("Add a script in Step 1 first.");
      return;
    }
    setCreatingJob(true);
    setComposerError(null);
    try {
      // Primary selection is authoritative: free:en-US-GuyNeural | trained UUID
      const voiceProfileId = (primaryVoiceId || selectedVoiceIds[0] || DEFAULT_FREE_VOICE_ID).trim();
      const avatarProfileId = primaryFaceId === FREE_FACE ? null : primaryFaceId;
      const castProfileIds = Array.from(
        new Set([
          voiceProfileId,
          ...selectedVoiceIds,
          ...selectedFaceIds.filter((id) => id !== FREE_FACE),
          ...(avatarProfileId ? [avatarProfileId] : []),
        ])
      );

      const res = await fetch("/api/avatar-studio/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          script,
          voiceModelId,
          avatarModelId,
          qualityTier: "standard" as QualityTier,
          mode: "single" as JobMode,
          targetDurationMinutes: undefined,
          // Always send — free: presets and trained UUIDs both go here
          voiceProfileId,
          avatarProfileId: avatarProfileId ?? undefined,
          castProfileIds,
          videoGenre: memesEnabled ? videoGenre : null,
          memePlacements: memesEnabled && memeSelections.length > 0 ? memeSelections : null,
        }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        if (res.status === 422 && data.error === "moderation_rejected") {
          setComposerError(`Script blocked: ${data.reason ?? "policy"}`);
        } else if (res.status === 402) {
          setComposerError(`${data.error} Try free models or wait for credit reset.`);
        } else if (res.status === 403 && data.error === "consent_required") {
          setComposerError("Using trained voice/face requires consent — grant it on the Train tab.");
        } else {
          setComposerError(data.error || "Could not start generation");
        }
        return;
      }
      setActiveJobId(data.job?.id ?? null);
      setCreateStep(5);
      toast("Generation started", "success");
      void loadJobs();
      void loadTokens();
    } catch {
      setComposerError("Could not start generation");
    } finally {
      setCreatingJob(false);
    }
  }

  async function handleCancelJob(id: string) {
    try {
      const res = await fetch(`/api/avatar-studio/jobs/${id}/cancel`, { method: "POST" });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not cancel", "error");
        return;
      }
      toast("Cancelled — tokens refunded", "success");
      void loadJobs();
      void loadTokens();
    } catch {
      toast("Could not cancel", "error");
    }
  }

  function openChangeVoice(job: AvatarJob) {
    setRevoiceError(null);
    setRevoiceJobId(job.id);
    void loadProfiles();
  }

  async function handleRevoice(voiceProfileId: string) {
    if (!revoiceJobId) return;
    setRevoiceBusy(true);
    setRevoiceError(null);
    try {
      const res = await fetch(`/api/avatar-studio/jobs/${revoiceJobId}/revoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceProfileId }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        if (res.status === 403 && data.error === "consent_required") {
          setRevoiceError("Grant voice/face consent on Train before using a trained sample.");
        } else {
          setRevoiceError(data.error || data.detail || "Could not start re-voice");
        }
        return;
      }
      setRevoiceJobId(null);
      toast("Updating full voice — keep this page open", "success");
      void loadJobs();
      // Stay on current tab / job; create step 5 if this was the active job
      if (activeJobId === revoiceJobId) setCreateStep(5);
      if (viewJobId === revoiceJobId || !viewJobId) setViewJobId(revoiceJobId);
    } catch {
      setRevoiceError("Could not start re-voice");
    } finally {
      setRevoiceBusy(false);
    }
  }

  async function handleConsentToggle(type: ConsentType, action: "grant" | "withdraw") {
    setConsentBusy(type);
    try {
      const res = await fetch("/api/avatar-studio/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action }),
      });
      if (!res.ok) {
        const data = await parseJson(res);
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

  async function grantCloneConsentFromTrain() {
    await handleConsentToggle("voice_face_clone", "grant");
  }

  const hasCloneConsent = consent?.voice_face_clone?.granted ?? false;

  async function handleSaveSetup() {
    setSavingSetup(true);
    try {
      const res = await fetch("/api/avatar-studio/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceMode: setupVoiceMode,
          voiceEndpointUrl: setupVoiceUrl || null,
          avatarMode: setupAvatarMode,
          avatarEndpointUrl: setupAvatarUrl || null,
          stitchMode: setupStitchMode,
          frameExtractEndpointUrl: setupFrameUrl || null,
          stitchEndpointUrl: setupStitchUrl || null,
          presenterPortraitUrl: setupPortraitUrl || null,
          presenterStylePrompt: setupStylePrompt || null,
        }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        toast(data.error || "Could not save setup", "error");
        return;
      }
      setUserSettings(data.settings);
      if (data.freemium) setFreemium(data.freemium);
      toast("Setup saved", "success");
      void loadModels();
    } catch {
      toast("Could not save setup", "error");
    } finally {
      setSavingSetup(false);
    }
  }

  async function handleDisconnectDrive() {
    if (!window.confirm("Disconnect Google Drive?")) return;
    try {
      await fetch("/api/avatar-studio/storage/drive/disconnect", { method: "POST" });
      toast("Drive disconnected", "success");
      void loadDriveStatus();
    } catch {
      toast("Could not disconnect", "error");
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof Sparkles }[] = [
    { id: "create", label: "Create", icon: Sparkles },
    { id: "train", label: "Train", icon: Mic },
    { id: "videos", label: "My videos", icon: Film },
    { id: "setup", label: "Setup", icon: FolderCog },
  ];

  const stepLabels = ["Script", "Voice", "Face", "Generate", "Watch"] as const;
  const cfg = configSummary();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <StudioHero
        onCreate={() => {
          switchTab("create");
          setCreateStep(1);
        }}
        onTrain={() => switchTab("train")}
      />

      <StudioJourneyStrip activeTab={activeTab} onSelect={(tab) => switchTab(tab)} />

      {/* Tabs — visual pills */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/40 p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium min-w-[6.5rem]",
                active
                  ? "bg-navy text-white shadow-sm dark:bg-white dark:text-navy"
                  : "text-text-secondary hover:bg-card"
              )}
              whileHover={reduceMotion || active ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: DURATION.hover, ease: EASE_OUT }}
            >
              <Icon className="size-4" />
              {t.label}
            </motion.button>
          );
        })}
      </div>

      {loadingInitial ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* CREATE — systematic voice/face selection + live config */}
          {activeTab === "create" && (
            <div className="flex flex-col gap-5">
              {/* Free video memes — top of creation (script-aware) */}
              <MotionReveal>
                <MemeSuggestPanel
                  script={script}
                  enabled={memesEnabled}
                  onEnabledChange={setMemesEnabled}
                  selected={memeSelections}
                  onSelectedChange={setMemeSelections}
                  videoGenre={videoGenre}
                  onVideoGenreChange={setVideoGenre}
                />
              </MotionReveal>

              {/* Live cast — face + voice only */}
              <MotionReveal>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                  <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        primaryFaceId !== FREE_FACE
                          ? faceProfiles.find((p) => p.id === primaryFaceId)?.sourceMedia?.url ||
                            faceProfiles.find((p) => p.id === primaryFaceId)?.mediaBank?.find((m) => m.kind === "image")
                              ?.url ||
                            "/images/avatar-priya-sharma.jpg"
                          : "/images/avatar-sarah-chen.jpg"
                      }
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Your cast</p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {cfg.faceLabel}
                      <span className="font-normal text-text-secondary"> · {cfg.voiceLabel}</span>
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => switchTab("train")}>
                    <Mic className="size-4" /> Train
                  </Button>
                </div>
              </MotionReveal>

              <div className="flex flex-wrap items-center gap-2">
                {stepLabels.map((label, i) => {
                  const n = (i + 1) as CreateStep;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCreateStep(n)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        createStep === n
                          ? "bg-accent-teal text-white"
                          : createStep > n
                            ? "bg-accent-teal/15 text-teal"
                            : "bg-muted text-text-secondary"
                      )}
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-[10px]">
                        {n}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>

              {createStep === 1 && (
                <StudioStepVisual step={1} title="Script" image="/images/brand-courses-tracks.jpg">
                    <FieldGroup>
                      <Select
                        label="Category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        options={categories.map((c) => ({ value: c.id, label: c.label }))}
                      />
                      <FilterTabs
                        label="Source"
                        value={scriptSource}
                        onChange={(v) => setScriptSource(v as "generate" | "paste")}
                        options={[
                          { value: "generate", label: "Generate from topic" },
                          { value: "paste", label: "Paste script" },
                        ]}
                      />
                      {scriptSource === "generate" ? (
                        <Input
                          label="Topic"
                          placeholder="e.g. 3 tips for async/await"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                        />
                      ) : (
                        <Field>
                          <FieldLabel>Paste script</FieldLabel>
                          <textarea
                            className="min-h-36 w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
                            value={rawScript}
                            onChange={(e) => setRawScript(e.target.value)}
                            placeholder="Paste the words your presenter will say…"
                          />
                        </Field>
                      )}
                      <Button
                        variant="secondary"
                        loading={generatingScript}
                        disabled={scriptSource === "generate" ? !topic.trim() : !rawScript.trim()}
                        onClick={handleGenerateScript}
                      >
                        <Sparkles className="size-4" />
                        {scriptSource === "generate" ? "Generate draft" : "Use pasted script"}
                      </Button>
                      {script ? (
                        <Field>
                          <FieldLabel>
                            Script ({script.trim().split(/\s+/).filter(Boolean).length} words)
                          </FieldLabel>
                          <textarea
                            className="min-h-48 w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                          />
                        </Field>
                      ) : null}
                    </FieldGroup>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setCreateStep(2)} disabled={!script.trim()}>
                        Next: voice
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                </StudioStepVisual>
              )}

              {createStep === 2 && (
                <StudioStepVisual step={2} title="Choose voice" image="/images/workshop.jpg">
                    <div className="flex flex-col gap-5">
                      <FreeVoiceList
                        selectedIds={selectedVoiceIds}
                        primaryId={primaryVoiceId}
                        onToggle={toggleVoiceSelect}
                        onSetPrimary={setPrimaryVoiceId}
                      />
                      <TrainedVoiceList
                        profiles={voiceProfiles}
                        selectedIds={selectedVoiceIds}
                        primaryId={primaryVoiceId}
                        onToggle={toggleVoiceSelect}
                        onSetPrimary={setPrimaryVoiceId}
                      />
                      {voiceProfiles.length === 0 ? (
                        <StudioVisualTip image="/images/avatar-david-okonkwo.jpg" title="Train a new voice">
                          <p>
                            Free catalogue voices are above. To use <strong>your</strong> voice: open Train, record
                            15–30s, Save &amp; train, then come back and select it here.
                          </p>
                          <Button size="sm" className="mt-2" onClick={() => switchTab("train")}>
                            <Mic className="size-4" /> Train new voice
                          </Button>
                        </StudioVisualTip>
                      ) : null}
                      {!hasCloneConsent && selectedVoiceIds.some((id) => !isFreeVoiceId(id)) ? (
                        <Alert variant="warning" title="Consent needed">
                          Grant consent on Train before using a recorded sample.
                        </Alert>
                      ) : null}
                    </div>
                    <div className="flex justify-between gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setCreateStep(1)}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button onClick={() => setCreateStep(3)}>
                        Next: face
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                </StudioStepVisual>
              )}

              {createStep === 3 && (
                <StudioStepVisual step={3} title="Choose face" image="/images/avatar-maria-gonzalez.jpg">
                    <FacePickerList
                      freeId={FREE_FACE}
                      profiles={faceProfiles}
                      selectedIds={selectedFaceIds}
                      primaryId={primaryFaceId}
                      onToggle={toggleFaceSelect}
                      onSetPrimary={setPrimaryFaceId}
                    />
                    {faceProfiles.length === 0 ? (
                      <StudioVisualTip image="/images/avatar-arjun-mehta.jpg" title="Add a character face">
                        <p>Upload photos or a multi-angle video in Train.</p>
                        <Button size="sm" variant="secondary" className="mt-2" onClick={() => switchTab("train")}>
                          Train face
                        </Button>
                      </StudioVisualTip>
                    ) : null}
                    <div className="flex justify-between gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setCreateStep(2)}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button onClick={() => setCreateStep(4)}>
                        Next: generate
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                </StudioStepVisual>
              )}

              {createStep === 4 && (
                <StudioStepVisual step={4} title="Review & generate" image="/images/presentation.jpg">
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                        <div className="relative mx-auto aspect-[3/4] w-28 overflow-hidden rounded-2xl border border-border shadow-md sm:mx-0 sm:w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              primaryFaceId !== FREE_FACE
                                ? faceProfiles.find((p) => p.id === primaryFaceId)?.sourceMedia?.url ||
                                  "/images/avatar-priya-sharma.jpg"
                                : "/images/avatar-sarah-chen.jpg"
                            }
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                          <p className="font-semibold text-foreground">Ready to generate</p>
                          <ul className="mt-2 flex list-none flex-col gap-2 text-text-secondary">
                            <li>
                              <strong className="text-foreground">Voice:</strong> {cfg.voiceLabel}
                            </li>
                            <li>
                              <strong className="text-foreground">Face:</strong> {cfg.faceLabel}
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted p-4 text-sm text-text-secondary">
                        <p className="mb-1 text-xs font-medium text-text-secondary">Script preview</p>
                        <p className="line-clamp-4 whitespace-pre-wrap text-foreground">{script.slice(0, 480)}</p>
                      </div>
                      {composerError ? (
                        <Alert variant="destructive" title="Could not start">
                          {composerError}
                        </Alert>
                      ) : null}
                    </div>
                    <div className="flex justify-between gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setCreateStep(3)}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button onClick={handleCreateJob} loading={creatingJob}>
                        <Play className="size-4" />
                        Create video
                      </Button>
                    </div>
                </StudioStepVisual>
              )}

              {createStep === 5 && (
                <StudioStepVisual step={5} title="Watch result" image="/images/hero-premium.jpg">
                    {activeJob ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={activeJob.status} />
                          {!TERMINAL.has(activeJob.status) ? (
                            <Button variant="secondary" size="sm" onClick={() => handleCancelJob(activeJob.id)}>
                              Cancel & refund
                            </Button>
                          ) : null}
                          <Button variant="secondary" size="sm" onClick={() => void loadJobs()}>
                            <RefreshCw className="size-4" />
                            Refresh
                          </Button>
                        </div>
                        {!TERMINAL.has(activeJob.status) ? (
                          <div className="flex flex-col gap-2">
                            <Progress value={jobProgressValue(activeJob)} label={jobProgressLabel(activeJob)} />
                          </div>
                        ) : null}
                        {activeJob.error ? (
                          <Alert variant="destructive" title="Generation failed">
                            {activeJob.error}
                          </Alert>
                        ) : null}
                        {hasPlayableOutput(activeJob) ? (
                          <ResultPlayer job={activeJob} onChangeVoice={openChangeVoice} />
                        ) : null}
                      </div>
                    ) : (
                      <StudioVisualTip image="/images/presentation.jpg" title="No active job yet">
                        <p>Generate from step 4, or open My videos.</p>
                      </StudioVisualTip>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCreateStep(1);
                          setActiveJobId(null);
                          setScript("");
                          setTopic("");
                        }}
                      >
                        Create another
                      </Button>
                      <Button onClick={() => switchTab("videos")}>
                        <Film className="size-4" />
                        All my videos
                      </Button>
                    </div>
                </StudioStepVisual>
              )}
            </div>
          )}

          {/* TRAIN — camera / laptop upload / Drive connector */}
          {activeTab === "train" && (
            <TrainCapturePanel
              hasCloneConsent={hasCloneConsent}
              onRequestConsent={() => void grantCloneConsentFromTrain()}
              driveStatus={driveStatus}
              onDriveChange={() => void loadDriveStatus()}
            />
          )}

          {/* VIDEOS */}
          {activeTab === "videos" && (
            <div className="flex flex-col gap-6">
              <StudioVisualTip
                image="/images/hero-premium.jpg"
                title="My videos"
                cta={
                  <Button size="sm" onClick={() => switchTab("create")}>
                    <Sparkles className="size-4" /> New video
                  </Button>
                }
              >
                <p>Watch finished jobs, scrub progress, and re-open any cast you made.</p>
              </StudioVisualTip>
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Library</h2>
                  <Button variant="secondary" size="sm" onClick={() => void loadJobs()}>
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
                {jobs.length === 0 ? (
                  <StudioVisualTip image="/images/presentation.jpg" title="No videos yet">
                    <p className="mb-2">Create a free presenter video from a short script.</p>
                    <Button size="sm" onClick={() => switchTab("create")}>
                      <Sparkles className="size-4" /> Start create
                    </Button>
                  </StudioVisualTip>
                ) : (
                  jobs.map((job) => (
                    <Card
                      key={job.id}
                      hover
                      flush
                      onClick={() => setViewJobId(job.id)}
                      className={cn("cursor-pointer overflow-hidden", viewJobId === job.id && "ring-2 ring-accent-teal")}
                    >
                      <div className="relative h-16 w-full bg-navy">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/hero-neural-poster.jpg"
                          alt=""
                          className="size-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                          <StatusBadge status={job.status} />
                          {hasPlayableOutput(job) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-white">
                              <Eye className="size-3" /> Play
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <CardContent className="gap-1 p-3">
                        <p className="line-clamp-2 text-sm text-foreground">{job.script.slice(0, 100)}</p>
                        <p className="text-xs text-text-secondary">{new Date(job.createdAt).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Card flush className="min-h-[300px] overflow-hidden">
                {!viewJob ? (
                  <div className="relative flex min-h-[320px] flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/hero-home-visual.jpg"
                      alt=""
                      className="absolute inset-0 size-full object-cover opacity-30"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
                      <Film className="size-10 text-accent-teal" />
                      <p className="font-semibold text-foreground">Pick a video to watch</p>
                      <p className="text-sm text-text-secondary">
                        {completedJobs.length > 0
                          ? `${completedJobs.length} ready`
                          : "Your player appears here"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge status={viewJob.status} />
                        {!TERMINAL.has(viewJob.status) ? (
                          <Button variant="secondary" size="sm" onClick={() => handleCancelJob(viewJob.id)}>
                            Cancel & refund
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {viewJob.error ? (
                        <Alert variant="destructive" title="Failed">
                          {viewJob.error}
                        </Alert>
                      ) : null}
                      {!TERMINAL.has(viewJob.status) ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-text-secondary">Generation progress</p>
                          <Progress value={jobProgressValue(viewJob)} label={jobProgressLabel(viewJob)} />
                        </div>
                      ) : null}
                      {hasPlayableOutput(viewJob) ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-text-secondary">Playback</p>
                          <ResultPlayer job={viewJob} onChangeVoice={openChangeVoice} />
                        </div>
                      ) : TERMINAL.has(viewJob.status) ? (
                        <Alert variant="info" title="No playable output">
                          This job finished without media.
                          {canChangeVoice(viewJob) ? (
                            <div className="mt-2">
                              <Button size="sm" variant="secondary" onClick={() => openChangeVoice(viewJob)}>
                                <Mic className="size-4" /> Change voice &amp; regenerate
                              </Button>
                            </div>
                          ) : null}
                        </Alert>
                      ) : (
                        <p className="text-sm text-text-secondary">Still generating…</p>
                      )}
                      <Separator />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">Script</p>
                        <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm text-text-secondary">
                          {viewJob.script}
                        </p>
                      </div>
                      {canChangeVoice(viewJob) ? (
                        <div className="pt-2">
                          <Button type="button" variant="secondary" onClick={() => openChangeVoice(viewJob)}>
                            <Mic className="size-4" />
                            Change voice
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
            </div>
          )}

          {/* SETUP */}
          {activeTab === "setup" && (
            <div className="flex flex-col gap-6">
              <Card flush>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-accent-teal" />
                    Generation backends
                  </CardTitle>
                  <CardDescription>
                    Freemium works with no GPU. Prefer a paid host or machine on your desk? Paste the endpoint URL.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                      <p className="font-medium text-foreground">Voice</p>
                      <FilterTabs
                        label="Mode"
                        value={setupVoiceMode}
                        onChange={(v) => setSetupVoiceMode(v as "free" | "custom_url")}
                        options={[
                          { value: "free", label: "Free neural voice" },
                          { value: "custom_url", label: "Custom / local URL" },
                        ]}
                      />
                      {setupVoiceMode === "custom_url" ? (
                        <>
                          <Input
                            label="Voice endpoint URL"
                            placeholder="https://host/tts or http://localhost:8090/tts"
                            value={setupVoiceUrl}
                            onChange={(e) => setSetupVoiceUrl(e.target.value)}
                          />
                          <FieldDescription>{freemium?.customEndpoints.voice}</FieldDescription>
                        </>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                      <p className="font-medium text-foreground">Avatar / lip-sync</p>
                      <FilterTabs
                        label="Mode"
                        value={setupAvatarMode}
                        onChange={(v) => setSetupAvatarMode(v as "free" | "custom_url")}
                        options={[
                          { value: "free", label: "Free Presenter" },
                          { value: "custom_url", label: "Custom / local URL" },
                        ]}
                      />
                      {setupAvatarMode === "custom_url" ? (
                        <>
                          <Input
                            label="Avatar endpoint URL"
                            placeholder="https://host/lipsync or http://localhost:8091/avatar"
                            value={setupAvatarUrl}
                            onChange={(e) => setSetupAvatarUrl(e.target.value)}
                          />
                          <FieldDescription>{freemium?.customEndpoints.avatar}</FieldDescription>
                        </>
                      ) : (
                        <>
                          <Input
                            label="Portrait URL (optional)"
                            placeholder="https://…/face.jpg — blank auto-generates"
                            value={setupPortraitUrl}
                            onChange={(e) => setSetupPortraitUrl(e.target.value)}
                          />
                          <Input
                            label="Portrait style (optional)"
                            placeholder="professional presenter, navy blazer…"
                            value={setupStylePrompt}
                            onChange={(e) => setSetupStylePrompt(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                    <p className="font-medium text-foreground">Long-form stitch (ffmpeg, no GPU)</p>
                    <FilterTabs
                      label="Mode"
                      value={setupStitchMode}
                      onChange={(v) => setSetupStitchMode(v as "free_skip" | "custom_url")}
                      options={[
                        { value: "free_skip", label: "Free single package" },
                        { value: "custom_url", label: "Custom stitch URLs" },
                      ]}
                    />
                    {setupStitchMode === "custom_url" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Frame extract URL"
                          value={setupFrameUrl}
                          onChange={(e) => setSetupFrameUrl(e.target.value)}
                        />
                        <Input
                          label="Stitch URL"
                          value={setupStitchUrl}
                          onChange={(e) => setSetupStitchUrl(e.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <Button onClick={handleSaveSetup} loading={savingSetup}>
                    <Check className="size-4" />
                    Save generation setup
                  </Button>
                </CardContent>
              </Card>

              <DriveConnectorCard
                driveStatus={driveStatus}
                onDisconnect={async () => {
                  await fetch("/api/avatar-studio/storage/drive/disconnect", { method: "POST" });
                  toast("Drive disconnected", "success");
                  void loadDriveStatus();
                }}
              />

              <Card flush>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Consent & legal addendum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(Object.keys(CONSENT_COPY) as ConsentType[]).map((type) => {
                    const granted = consent?.[type]?.granted ?? false;
                    return (
                      <div
                        key={type}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-4"
                      >
                        <div className="max-w-xl">
                          <p className="font-medium text-foreground">{CONSENT_COPY[type].title}</p>
                          <p className="mt-1 text-sm text-text-secondary">{CONSENT_COPY[type].description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={granted ? "secondary" : "primary"}
                          loading={consentBusy === type}
                          onClick={() => handleConsentToggle(type, granted ? "withdraw" : "grant")}
                        >
                          {granted ? "Withdraw" : "I agree"}
                        </Button>
                      </div>
                    );
                  })}
                  <FieldDescription>
                    Sitewide privacy version bump is not forced here (avoids re-prompting every user). This page carries
                    the voice/face addendum until dedicated legal pages ship.
                  </FieldDescription>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <ChangeVoiceModal
        open={Boolean(revoiceJobId)}
        onClose={() => {
          if (!revoiceBusy) {
            setRevoiceJobId(null);
            setRevoiceError(null);
          }
        }}
        currentVoiceId={
          revoiceJobId ? (jobs.find((j) => j.id === revoiceJobId)?.voiceProfileId ?? null) : null
        }
        profiles={profiles}
        hasCloneConsent={hasCloneConsent}
        submitting={revoiceBusy}
        error={revoiceError}
        onSubmit={(voiceId) => void handleRevoice(voiceId)}
        onTrainNew={() => {
          setRevoiceJobId(null);
          setRevoiceError(null);
          switchTab("train");
        }}
      />

      <p className="mt-8 text-center text-xs text-text-secondary/70">Signed in as {userEmail}</p>
    </div>
  );
}
