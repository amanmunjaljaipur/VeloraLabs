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
  // Avatar/lip-sync models
  { id: "duix-avatar", kind: "avatar", label: "Duix-Avatar", tokenCostPerMinute: { standard: 4, high: 8, best: 16 }, freeTierFallback: false, endpointEnvVar: "AVATAR_DUIX_ENDPOINT_URL", licenseNote: "Commercial use permitted; requires a signed commercial agreement past 100,000 users or $10M annual revenue - track this threshold.", maxClipSeconds: 10 },
  { id: "musetalk", kind: "avatar", label: "MuseTalk (real-time)", tokenCostPerMinute: { standard: 0, high: 3, best: 6 }, freeTierFallback: true, endpointEnvVar: "AVATAR_MUSETALK_ENDPOINT_URL", licenseNote: "Verify current license terms before commercial use.", maxClipSeconds: 10 },
  { id: "wav2lip", kind: "avatar", label: "Wav2Lip (specialist/fallback)", tokenCostPerMinute: { standard: 2, high: 4, best: 8 }, freeTierFallback: false, endpointEnvVar: "AVATAR_WAV2LIP_ENDPOINT_URL", licenseNote: "Verify current license terms before commercial use.", maxClipSeconds: 15 },
  // Voice/TTS models
  { id: "xtts-v2", kind: "voice", label: "Coqui XTTS-v2", tokenCostPerMinute: { standard: 3, high: 6, best: 12 }, freeTierFallback: false, endpointEnvVar: "VOICE_XTTS_ENDPOINT_URL", licenseNote: "Verify current license terms at implementation time - has had changes." },
  { id: "openvoice", kind: "voice", label: "OpenVoice", tokenCostPerMinute: { standard: 2, high: 5, best: 10 }, freeTierFallback: false, endpointEnvVar: "VOICE_OPENVOICE_ENDPOINT_URL", licenseNote: "Check current repo license before commercial use." },
  { id: "f5-tts", kind: "voice", label: "F5-TTS", tokenCostPerMinute: { standard: 2, high: 5, best: 10 }, freeTierFallback: false, endpointEnvVar: "VOICE_F5TTS_ENDPOINT_URL", licenseNote: "Verify current license terms before commercial use." },
  { id: "bark", kind: "voice", label: "Bark (expressive)", tokenCostPerMinute: { standard: 3, high: 7, best: 14 }, freeTierFallback: false, endpointEnvVar: "VOICE_BARK_ENDPOINT_URL", licenseNote: "Check current repo license before commercial use." },
  { id: "piper", kind: "voice", label: "Piper (low-latency)", tokenCostPerMinute: { standard: 0, high: 2, best: 4 }, freeTierFallback: true, endpointEnvVar: "VOICE_PIPER_ENDPOINT_URL", licenseNote: "MIT - permissive." },
  { id: "mms-tts", kind: "voice", label: "Meta MMS-TTS (max language coverage)", tokenCostPerMinute: { standard: 3, high: 6, best: 12 }, freeTierFallback: false, endpointEnvVar: "VOICE_MMS_ENDPOINT_URL", licenseNote: "Some components CC-BY-NC - verify non-commercial restriction before commercial use." },
];

async function readAll(): Promise<ModelEntry[]> {
  await ensureDataFileHydrated(CATALOG_FILE, DEFAULT_JSON, { force: true });
  const existing = readJsonFile<ModelEntry[]>(CATALOG_FILE, DEFAULT_JSON);
  if (existing.length > 0) return existing;
  await writeJsonFileAsync(CATALOG_FILE, SEED_CATALOG, DEFAULT_JSON);
  return SEED_CATALOG;
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
