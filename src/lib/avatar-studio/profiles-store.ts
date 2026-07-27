import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * User-cloned voice/avatar profiles ("bring your own voice/face").
 *
 * Characters (avatar/both) can hold an **image bank** — multiple training photos —
 * with one **cover** used in pickers and free Presenter generation.
 * Voice profiles keep a primary audio in sourceMedia (+ optional bank for extras).
 */

const PROFILES_FILE = "avatar-clone-profiles.json";
const DEFAULT_JSON = "[]";

export type ProfileKind = "voice" | "avatar" | "both";
export type ProfileStatus = "processing" | "ready" | "failed";
export type MediaKind = "image" | "audio" | "video";

export interface ProfileMediaItem {
  id: string;
  provider: "blob" | "google_drive";
  url: string;
  mimeType: string;
  kind: MediaKind;
  /** Optional label inside the bank */
  label?: string;
  createdAt: string;
}

export interface CloneProfile {
  id: string;
  email: string;
  name: string;
  kind: ProfileKind;
  status: ProfileStatus;
  /**
   * Primary / cover media (kept for backward compatibility).
   * For characters this mirrors the cover image from the bank.
   */
  sourceMedia: { provider: "blob" | "google_drive"; url: string } | null;
  /** Full training bank (images for faces; audio for voices). */
  mediaBank: ProfileMediaItem[];
  /** Which mediaBank item is the cover / primary portrait. */
  coverMediaId: string | null;
  /**
   * Freemium free-path neural voice (Edge ShortName) used as secondary fallback.
   */
  ttsVoiceHint: string | null;
  /**
   * Gemini TTS prebuilt voice chosen during sample training (e.g. "Kore", "Orus").
   * Primary free path for trained voices — style-matched to the sample.
   */
  geminiVoice: string | null;
  /** Natural-language director notes so Gemini TTS matches the trained speaker. */
  voiceStylePrompt: string | null;
  /** Short human summary from training (accent/gender). */
  trainSummary: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Best audio URL for a voice/both profile (bank preferred). */
export function getVoiceSampleUrl(profile: CloneProfile): string | null {
  const n = normalizeProfile(profile);
  const audio =
    n.mediaBank.find((m) => m.kind === "audio") ??
    n.mediaBank.find((m) => (m.mimeType || "").startsWith("audio/"));
  if (audio?.url) return audio.url;
  if (n.sourceMedia?.url) {
    const u = n.sourceMedia.url;
    // Skip obvious image posters
    if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)) return null;
    return u;
  }
  return null;
}

function mimeToKind(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "image";
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url) || url.includes("image");
}

/** Normalize legacy rows that only have sourceMedia. */
export function normalizeProfile(raw: CloneProfile | Record<string, unknown>): CloneProfile {
  const p = raw as CloneProfile;
  const bank: ProfileMediaItem[] = Array.isArray(p.mediaBank) ? [...p.mediaBank] : [];
  let coverMediaId = typeof p.coverMediaId === "string" ? p.coverMediaId : null;
  let sourceMedia = p.sourceMedia ?? null;

  // Seed bank from legacy sourceMedia (stable id so cover stays consistent across reads)
  if (bank.length === 0 && sourceMedia?.url) {
    const kind: MediaKind =
      isImageUrl(sourceMedia.url) || p.kind === "avatar"
        ? "image"
        : p.kind === "voice"
          ? "audio"
          : "video";
    const seeded: ProfileMediaItem = {
      id: `legacy-cover-${p.id}`,
      provider: sourceMedia.provider,
      url: sourceMedia.url,
      mimeType: kind === "image" ? "image/jpeg" : kind === "audio" ? "audio/webm" : "video/webm",
      kind,
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
    };
    bank.push(seeded);
    coverMediaId = seeded.id;
  }

  // Ensure cover points at something in the bank
  if (coverMediaId && !bank.some((m) => m.id === coverMediaId)) {
    coverMediaId = bank[0]?.id ?? null;
  }
  if (!coverMediaId && bank.length > 0) {
    // Prefer first image for characters
    const cover =
      bank.find((m) => m.kind === "image") ?? bank.find((m) => m.kind === "video") ?? bank[0]!;
    coverMediaId = cover.id;
  }

  // Keep sourceMedia in sync with cover
  if (coverMediaId) {
    const cover = bank.find((m) => m.id === coverMediaId);
    if (cover) {
      sourceMedia = { provider: cover.provider, url: cover.url };
    }
  }

  return {
    id: p.id,
    email: p.email,
    name: p.name,
    kind: p.kind,
    status: p.status ?? "ready",
    sourceMedia,
    mediaBank: bank,
    coverMediaId,
    ttsVoiceHint:
      typeof p.ttsVoiceHint === "string" && p.ttsVoiceHint.trim()
        ? p.ttsVoiceHint.trim()
        : null,
    geminiVoice:
      typeof (p as CloneProfile).geminiVoice === "string" && (p as CloneProfile).geminiVoice?.trim()
        ? (p as CloneProfile).geminiVoice!.trim()
        : null,
    voiceStylePrompt:
      typeof (p as CloneProfile).voiceStylePrompt === "string" &&
      (p as CloneProfile).voiceStylePrompt?.trim()
        ? (p as CloneProfile).voiceStylePrompt!.trim()
        : null,
    trainSummary:
      typeof (p as CloneProfile).trainSummary === "string" && (p as CloneProfile).trainSummary?.trim()
        ? (p as CloneProfile).trainSummary!.trim()
        : null,
    error: p.error ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt ?? p.createdAt,
  };
}

/** Cover / primary portrait URL for UI + generation. */
export function getCoverMedia(profile: CloneProfile): ProfileMediaItem | null {
  const n = normalizeProfile(profile);
  if (n.coverMediaId) {
    const hit = n.mediaBank.find((m) => m.id === n.coverMediaId);
    if (hit) return hit;
  }
  return (
    n.mediaBank.find((m) => m.kind === "image") ??
    n.mediaBank[0] ??
    (n.sourceMedia
      ? {
          id: "legacy",
          provider: n.sourceMedia.provider,
          url: n.sourceMedia.url,
          mimeType: "application/octet-stream",
          kind: "image" as const,
          createdAt: n.createdAt,
        }
      : null)
  );
}

export function getCoverUrl(profile: CloneProfile): string | null {
  return getCoverMedia(profile)?.url ?? profile.sourceMedia?.url ?? null;
}

export function listImageBank(profile: CloneProfile): ProfileMediaItem[] {
  return normalizeProfile(profile).mediaBank.filter((m) => m.kind === "image" || m.kind === "video");
}

async function readAll(): Promise<CloneProfile[]> {
  await ensureDataFileHydrated(PROFILES_FILE, DEFAULT_JSON, { force: true });
  const raw = await readJsonFile<CloneProfile[]>(PROFILES_FILE, DEFAULT_JSON);
  return (Array.isArray(raw) ? raw : []).map((p) => normalizeProfile(p));
}

async function writeAll(items: CloneProfile[]): Promise<void> {
  await writeJsonFileAsync(PROFILES_FILE, items.map((p) => normalizeProfile(p)), DEFAULT_JSON);
}

export async function listProfilesForUser(email: string): Promise<CloneProfile[]> {
  const all = await readAll();
  return all.filter((p) => p.email === email.toLowerCase());
}

export async function getProfile(id: string, email: string): Promise<CloneProfile | null> {
  const all = await readAll();
  return all.find((p) => p.id === id && p.email === email.toLowerCase()) ?? null;
}

export async function createProfile(input: {
  email: string;
  name: string;
  kind: ProfileKind;
  sourceMedia: { provider: "blob" | "google_drive"; url: string };
  /** Optional full bank (if omitted, bank is seeded from sourceMedia). */
  mediaBank?: ProfileMediaItem[];
  coverMediaId?: string | null;
  ttsVoiceHint?: string | null;
  geminiVoice?: string | null;
  voiceStylePrompt?: string | null;
  trainSummary?: string | null;
}): Promise<CloneProfile> {
  const all = await readAll();
  const now = new Date().toISOString();
  let mediaBank = input.mediaBank ?? [];
  let coverMediaId = input.coverMediaId ?? null;

  if (mediaBank.length === 0 && input.sourceMedia) {
    const item: ProfileMediaItem = {
      id: randomUUID(),
      provider: input.sourceMedia.provider,
      url: input.sourceMedia.url,
      mimeType: "application/octet-stream",
      kind: input.kind === "voice" ? "audio" : "image",
      createdAt: now,
    };
    mediaBank = [item];
    coverMediaId = item.id;
  }
  if (!coverMediaId && mediaBank[0]) coverMediaId = mediaBank[0].id;
  const cover = mediaBank.find((m) => m.id === coverMediaId) ?? mediaBank[0] ?? null;

  const profile: CloneProfile = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    kind: input.kind,
    status: "processing",
    sourceMedia: cover
      ? { provider: cover.provider, url: cover.url }
      : input.sourceMedia,
    mediaBank,
    coverMediaId,
    ttsVoiceHint: input.ttsVoiceHint?.trim() || null,
    geminiVoice: input.geminiVoice?.trim() || null,
    voiceStylePrompt: input.voiceStylePrompt?.trim() || null,
    trainSummary: input.trainSummary?.trim() || null,
    error: null,
    createdAt: now,
    updatedAt: now,
  };
  all.push(profile);
  await writeAll(all);
  return normalizeProfile(profile);
}

export async function updateProfile(
  id: string,
  patch: Partial<
    Pick<
      CloneProfile,
      | "status"
      | "error"
      | "name"
      | "coverMediaId"
      | "mediaBank"
      | "sourceMedia"
      | "ttsVoiceHint"
      | "geminiVoice"
      | "voiceStylePrompt"
      | "trainSummary"
    >
  >
): Promise<CloneProfile | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = { ...all[idx]!, ...patch, updatedAt: new Date().toISOString() };
  // Keep sourceMedia synced when cover changes
  if (patch.coverMediaId || patch.mediaBank) {
    const normalized = normalizeProfile(next);
    all[idx] = normalized;
  } else {
    all[idx] = next;
  }
  await writeAll(all);
  return normalizeProfile(all[idx]!);
}

export async function addMediaToProfile(
  profileId: string,
  email: string,
  media: Omit<ProfileMediaItem, "id" | "createdAt"> & { id?: string; createdAt?: string },
  opts?: { setAsCover?: boolean }
): Promise<CloneProfile | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === profileId && p.email === email.toLowerCase());
  if (idx < 0) return null;
  const profile = normalizeProfile(all[idx]!);
  const item: ProfileMediaItem = {
    id: media.id ?? randomUUID(),
    provider: media.provider,
    url: media.url,
    mimeType: media.mimeType || "application/octet-stream",
    kind: media.kind || mimeToKind(media.mimeType || ""),
    label: media.label,
    createdAt: media.createdAt ?? new Date().toISOString(),
  };
  const mediaBank = [...profile.mediaBank, item];
  let coverMediaId = profile.coverMediaId;
  if (opts?.setAsCover || !coverMediaId) coverMediaId = item.id;
  const cover = mediaBank.find((m) => m.id === coverMediaId) ?? item;
  all[idx] = {
    ...profile,
    mediaBank,
    coverMediaId,
    sourceMedia: { provider: cover.provider, url: cover.url },
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return normalizeProfile(all[idx]!);
}

export async function setCoverMedia(
  profileId: string,
  email: string,
  mediaId: string
): Promise<CloneProfile | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === profileId && p.email === email.toLowerCase());
  if (idx < 0) return null;
  const profile = normalizeProfile(all[idx]!);
  const hit = profile.mediaBank.find((m) => m.id === mediaId);
  if (!hit) return null;
  all[idx] = {
    ...profile,
    coverMediaId: mediaId,
    sourceMedia: { provider: hit.provider, url: hit.url },
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return normalizeProfile(all[idx]!);
}

export async function removeMediaFromProfile(
  profileId: string,
  email: string,
  mediaId: string
): Promise<CloneProfile | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === profileId && p.email === email.toLowerCase());
  if (idx < 0) return null;
  const profile = normalizeProfile(all[idx]!);
  if (profile.mediaBank.length <= 1) {
    // Don't leave an empty character — caller should delete the profile instead
    return null;
  }
  const mediaBank = profile.mediaBank.filter((m) => m.id !== mediaId);
  let coverMediaId = profile.coverMediaId;
  if (coverMediaId === mediaId) {
    coverMediaId =
      mediaBank.find((m) => m.kind === "image")?.id ?? mediaBank[0]?.id ?? null;
  }
  const cover = mediaBank.find((m) => m.id === coverMediaId) ?? mediaBank[0] ?? null;
  all[idx] = {
    ...profile,
    mediaBank,
    coverMediaId,
    sourceMedia: cover ? { provider: cover.provider, url: cover.url } : null,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return normalizeProfile(all[idx]!);
}

export async function deleteProfile(id: string, email: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => !(p.id === id && p.email === email.toLowerCase()));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export function buildMediaItem(input: {
  provider: "blob" | "google_drive";
  url: string;
  mimeType: string;
  label?: string;
}): ProfileMediaItem {
  return {
    id: randomUUID(),
    provider: input.provider,
    url: input.url,
    mimeType: input.mimeType,
    kind: mimeToKind(input.mimeType),
    label: input.label,
    createdAt: new Date().toISOString(),
  };
}
