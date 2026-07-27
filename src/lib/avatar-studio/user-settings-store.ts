import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Per-user Avatar Studio setup: freemium by default, optional custom
 * generation endpoints (self-hosted GPU, fal proxy, etc.) and optional
 * ffmpeg stitch/frame URLs. Secrets are stored server-side only and never
 * returned raw to other users.
 */

const FILE = "avatar-user-settings.json";
const DEFAULT_JSON = "[]";

export type VoiceBackendMode = "free" | "custom_url";
export type AvatarBackendMode = "free" | "custom_url";
export type StitchBackendMode = "free_skip" | "custom_url";

export interface AvatarUserSettings {
  email: string;
  voiceMode: VoiceBackendMode;
  /** User-supplied voice/TTS endpoint (custom_url mode). */
  voiceEndpointUrl: string | null;
  avatarMode: AvatarBackendMode;
  /** User-supplied lip-sync/avatar endpoint (custom_url mode). */
  avatarEndpointUrl: string | null;
  stitchMode: StitchBackendMode;
  frameExtractEndpointUrl: string | null;
  stitchEndpointUrl: string | null;
  /** Optional portrait URL used for free Presenter mode when no clone profile image. */
  presenterPortraitUrl: string | null;
  /** Display name / style hint for free presenter portrait generation. */
  presenterStylePrompt: string | null;
  updatedAt: string;
}

export interface PublicAvatarUserSettings {
  voiceMode: VoiceBackendMode;
  voiceEndpointUrl: string | null;
  avatarMode: AvatarBackendMode;
  avatarEndpointUrl: string | null;
  stitchMode: StitchBackendMode;
  frameExtractEndpointUrl: string | null;
  stitchEndpointUrl: string | null;
  presenterPortraitUrl: string | null;
  presenterStylePrompt: string | null;
  updatedAt: string | null;
  /** Resolved readiness for the UI checklist. */
  freeVoiceReady: boolean;
  freeAvatarReady: boolean;
  customVoiceReady: boolean;
  customAvatarReady: boolean;
  customStitchReady: boolean;
}

const DEFAULTS: Omit<AvatarUserSettings, "email" | "updatedAt"> = {
  voiceMode: "free",
  voiceEndpointUrl: null,
  avatarMode: "free",
  avatarEndpointUrl: null,
  stitchMode: "free_skip",
  frameExtractEndpointUrl: null,
  stitchEndpointUrl: null,
  presenterPortraitUrl: null,
  presenterStylePrompt: null,
};

async function readAll(): Promise<AvatarUserSettings[]> {
  await ensureDataFileHydrated(FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<AvatarUserSettings[]>(FILE, DEFAULT_JSON);
}

async function writeAll(items: AvatarUserSettings[]): Promise<void> {
  await writeJsonFileAsync(FILE, items, DEFAULT_JSON);
}

function normalize(email: string, row: Partial<AvatarUserSettings> | null | undefined): AvatarUserSettings {
  return {
    email: email.toLowerCase(),
    voiceMode: row?.voiceMode === "custom_url" ? "custom_url" : "free",
    voiceEndpointUrl: typeof row?.voiceEndpointUrl === "string" && row.voiceEndpointUrl.trim() ? row.voiceEndpointUrl.trim() : null,
    avatarMode: row?.avatarMode === "custom_url" ? "custom_url" : "free",
    avatarEndpointUrl: typeof row?.avatarEndpointUrl === "string" && row.avatarEndpointUrl.trim() ? row.avatarEndpointUrl.trim() : null,
    stitchMode: row?.stitchMode === "custom_url" ? "custom_url" : "free_skip",
    frameExtractEndpointUrl:
      typeof row?.frameExtractEndpointUrl === "string" && row.frameExtractEndpointUrl.trim() ? row.frameExtractEndpointUrl.trim() : null,
    stitchEndpointUrl: typeof row?.stitchEndpointUrl === "string" && row.stitchEndpointUrl.trim() ? row.stitchEndpointUrl.trim() : null,
    presenterPortraitUrl:
      typeof row?.presenterPortraitUrl === "string" && row.presenterPortraitUrl.trim() ? row.presenterPortraitUrl.trim() : null,
    presenterStylePrompt:
      typeof row?.presenterStylePrompt === "string" && row.presenterStylePrompt.trim() ? row.presenterStylePrompt.trim() : null,
    updatedAt: row?.updatedAt ?? new Date().toISOString(),
  };
}

export async function getUserSettings(email: string): Promise<AvatarUserSettings> {
  const all = await readAll();
  const found = all.find((r) => r.email === email.toLowerCase());
  return normalize(email, found);
}

export async function getPublicUserSettings(email: string): Promise<PublicAvatarUserSettings> {
  const s = await getUserSettings(email);
  return {
    voiceMode: s.voiceMode,
    voiceEndpointUrl: s.voiceEndpointUrl,
    avatarMode: s.avatarMode,
    avatarEndpointUrl: s.avatarEndpointUrl,
    stitchMode: s.stitchMode,
    frameExtractEndpointUrl: s.frameExtractEndpointUrl,
    stitchEndpointUrl: s.stitchEndpointUrl,
    presenterPortraitUrl: s.presenterPortraitUrl,
    presenterStylePrompt: s.presenterStylePrompt,
    updatedAt: s.updatedAt,
    freeVoiceReady: true,
    // Free Presenter works with Blob, Drive, or local .data fallback
    freeAvatarReady: true,
    customVoiceReady: Boolean(s.voiceEndpointUrl),
    customAvatarReady: Boolean(s.avatarEndpointUrl),
    customStitchReady: Boolean(s.frameExtractEndpointUrl && s.stitchEndpointUrl),
  };
}

export async function updateUserSettings(
  email: string,
  patch: Partial<
    Pick<
      AvatarUserSettings,
      | "voiceMode"
      | "voiceEndpointUrl"
      | "avatarMode"
      | "avatarEndpointUrl"
      | "stitchMode"
      | "frameExtractEndpointUrl"
      | "stitchEndpointUrl"
      | "presenterPortraitUrl"
      | "presenterStylePrompt"
    >
  >
): Promise<AvatarUserSettings> {
  const all = await readAll();
  const normalizedEmail = email.toLowerCase();
  const idx = all.findIndex((r) => r.email === normalizedEmail);
  const current = idx >= 0 ? all[idx]! : normalize(email, null);
  const next = normalize(email, {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  await writeAll(all);
  return next;
}
