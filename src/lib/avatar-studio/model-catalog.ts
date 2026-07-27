import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Configurable model + token-cost catalog (Section 6 of the spec: "Token
 * costs per model should be configurable, not hardcoded - GPU costs and
 * model performance will shift over time"). Blob-backed so an admin can
 * retune costs without a redeploy, seeded with the spec's named models.
 *
 * Every model entry here is a REGISTRATION of a model this platform can
 * route to - not a live connection to one. The actual inference call lives
 * behind the Voice/Avatar Agents (src/lib/avatar-studio/agents/voice-
 * agent.ts, avatar-agent.ts), which are stubbed pending real GPU endpoints
 * per the "full scaffold, models stubbed" build decision. `endpointEnvVar`
 * names the environment variable an admin would set once a real endpoint
 * exists - agents check for it and fail over to the stub gracefully if
 * unset, rather than crashing.
 */

const CATALOG_FILE = "avatar-model-catalog.json";
const DEFAULT_JSON = "[]";

export type ModelKind = "avatar" | "voice";
export type QualityTier = "standard" | "high" | "best";

export interface ModelEntry {
  id: string;
  kind: ModelKind;
  label: string;
  /** Tokens consumed per minute of output at each quality tier. 0 = always free (the guaranteed never-fully-blocked fallback). */
  tokenCostPerMinute: Record<QualityTier, number>;
  /** True for exactly one model per kind - the zero-token fallback so free users always have a path to render. */
  freeTierFallback: boolean;
  /** Env var an admin sets once a real self-hosted endpoint exists for this model. Unset = agent uses the stub. */
  endpointEnvVar: string;
  licenseNote: string;
  /**
   * Avatar/video models only: longest single clip this model can render in
   * one call. Drives long-form segmentation (long-form-agent.ts splits a
   * long script into chunks of roughly this length, chaining clips via
   * last-frame continuity). PLACEHOLDER VALUE - confirm the real figure
   * against each model's docs when wiring up its endpoint; not independently
   * verified here.
   */
  maxClipSeconds?: number;
}

const SEED_CATALOG: ModelEntry[] = [
  // Avatar — free Presenter is the always-on freemium path (no GPU).
  // Catalog names kept for product continuity; when endpoint env is unset,
  // agents serve free Presenter for every avatar model (and custom URL from Setup wins).
  {
    id: "musetalk",
    kind: "avatar",
    label: "Free animated presenter (motion + voice)",
    tokenCostPerMinute: { standard: 0, high: 0, best: 0 },
    freeTierFallback: true,
    endpointEnvVar: "AVATAR_MUSETALK_ENDPOINT_URL",
    licenseNote:
      "Free path: portrait + Ken Burns motion MP4 + voice (ffmpeg, no GPU). Optional MuseTalk GPU host via Setup for true lip-sync.",
    maxClipSeconds: 60,
  },
  {
    id: "wav2lip",
    kind: "avatar",
    label: "Lip-sync (custom host / Wav2Lip)",
    tokenCostPerMinute: { standard: 2, high: 4, best: 8 },
    freeTierFallback: false,
    endpointEnvVar: "AVATAR_WAV2LIP_ENDPOINT_URL",
    licenseNote: "Requires your own endpoint URL in Setup (or platform env). Falls back to Free Presenter if unset.",
    maxClipSeconds: 15,
  },
  {
    id: "duix-avatar",
    kind: "avatar",
    label: "Lip-sync (custom host / Duix)",
    tokenCostPerMinute: { standard: 4, high: 8, best: 16 },
    freeTierFallback: false,
    endpointEnvVar: "AVATAR_DUIX_ENDPOINT_URL",
    licenseNote: "Requires your own endpoint. Falls back to Free Presenter if unset.",
    maxClipSeconds: 10,
  },
  // Voice — free Edge TTS when no custom host
  {
    id: "piper",
    kind: "voice",
    label: "Free multi-country neural voice",
    tokenCostPerMinute: { standard: 0, high: 0, best: 0 },
    freeTierFallback: true,
    endpointEnvVar: "VOICE_PIPER_ENDPOINT_URL",
    licenseNote:
      "Free path uses Microsoft Edge neural TTS via msedge-tts (US/UK/IN/AU/IE/CA/ZA). Optional self-host clone URL in Setup for true sample cloning.",
  },
  {
    id: "xtts-v2",
    kind: "voice",
    label: "Custom TTS / XTTS host",
    tokenCostPerMinute: { standard: 3, high: 6, best: 12 },
    freeTierFallback: false,
    endpointEnvVar: "VOICE_XTTS_ENDPOINT_URL",
    licenseNote: "Paste endpoint in Setup for clone-quality TTS. Falls back to free voice if unset.",
  },
  {
    id: "openvoice",
    kind: "voice",
    label: "Custom TTS / OpenVoice host",
    tokenCostPerMinute: { standard: 2, high: 5, best: 10 },
    freeTierFallback: false,
    endpointEnvVar: "VOICE_OPENVOICE_ENDPOINT_URL",
    licenseNote: "Optional custom host. Free voice is used when unset.",
  },
  {
    id: "f5-tts",
    kind: "voice",
    label: "Custom TTS / F5-TTS host",
    tokenCostPerMinute: { standard: 2, high: 5, best: 10 },
    freeTierFallback: false,
    endpointEnvVar: "VOICE_F5TTS_ENDPOINT_URL",
    licenseNote: "Optional custom host. Free voice is used when unset.",
  },
  {
    id: "bark",
    kind: "voice",
    label: "Custom TTS / Bark host",
    tokenCostPerMinute: { standard: 3, high: 7, best: 14 },
    freeTierFallback: false,
    endpointEnvVar: "VOICE_BARK_ENDPOINT_URL",
    licenseNote: "Optional custom host. Free voice is used when unset.",
  },
  {
    id: "mms-tts",
    kind: "voice",
    label: "Custom TTS / MMS host",
    tokenCostPerMinute: { standard: 3, high: 6, best: 12 },
    freeTierFallback: false,
    endpointEnvVar: "VOICE_MMS_ENDPOINT_URL",
    licenseNote: "Optional custom host. Free voice is used when unset.",
  },
];

async function readAll(): Promise<ModelEntry[]> {
  await ensureDataFileHydrated(CATALOG_FILE, DEFAULT_JSON, { force: true });
  const existing = readJsonFile<ModelEntry[]>(CATALOG_FILE, DEFAULT_JSON);
  if (existing.length === 0) {
    await writeJsonFileAsync(CATALOG_FILE, SEED_CATALOG, DEFAULT_JSON);
    return SEED_CATALOG;
  }

  // Soft-upgrade free fallback rows so older Blob catalogs pick up freemium
  // labels/clip lengths without wiping admin cost overrides on paid models.
  let changed = false;
  const byId = new Map(SEED_CATALOG.map((m) => [m.id, m]));
  const next = existing.map((row) => {
    const seed = byId.get(row.id);
    if (!seed || !seed.freeTierFallback) return row;
    const upgraded: ModelEntry = {
      ...row,
      label: seed.label,
      freeTierFallback: true,
      tokenCostPerMinute: seed.tokenCostPerMinute,
      maxClipSeconds: seed.maxClipSeconds ?? row.maxClipSeconds,
      licenseNote: seed.licenseNote,
    };
    if (
      upgraded.label !== row.label ||
      upgraded.maxClipSeconds !== row.maxClipSeconds ||
      upgraded.tokenCostPerMinute.standard !== row.tokenCostPerMinute.standard
    ) {
      changed = true;
    }
    return upgraded;
  });
  // Ensure free fallbacks always exist even if an older catalog dropped them.
  for (const seed of SEED_CATALOG.filter((m) => m.freeTierFallback)) {
    if (!next.some((m) => m.id === seed.id)) {
      next.push(seed);
      changed = true;
    }
  }
  if (changed) await writeJsonFileAsync(CATALOG_FILE, next, DEFAULT_JSON);
  return next;
}

export async function listModels(kind?: ModelKind): Promise<ModelEntry[]> {
  const all = await readAll();
  return kind ? all.filter((m) => m.kind === kind) : all;
}

export async function getModel(id: string): Promise<ModelEntry | null> {
  const all = await readAll();
  return all.find((m) => m.id === id) ?? null;
}

export async function getFreeTierFallback(kind: ModelKind): Promise<ModelEntry | null> {
  const all = await readAll();
  return all.find((m) => m.kind === kind && m.freeTierFallback) ?? null;
}

export async function upsertModel(model: ModelEntry): Promise<ModelEntry[]> {
  const all = await readAll();
  const idx = all.findIndex((m) => m.id === model.id);
  if (idx >= 0) all[idx] = model;
  else all.push(model);
  await writeJsonFileAsync(CATALOG_FILE, all, DEFAULT_JSON);
  return all;
}
