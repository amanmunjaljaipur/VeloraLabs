import { auth } from "@/auth";
import {
  listProfilesForUser,
  createProfile,
  buildMediaItem,
  type ProfileKind,
  type ProfileMediaItem,
} from "@/lib/avatar-studio/profiles-store";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PROFILE_KINDS = new Set<ProfileKind>(["voice", "avatar", "both"]);
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB per file
const MAX_FILES_PER_REQUEST = 12;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await listProfilesForUser(session.user.email);
  return NextResponse.json({ profiles });
}

/**
 * Creates a voice/face clone profile from one or more uploaded samples.
 *
 * Form fields:
 *   - name (required)
 *   - kind: voice | avatar | both
 *   - file  — single file (legacy)
 *   - files — multiple files (character image bank)
 *   - coverIndex — which files[] index is cover (default 0)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-profile-create:${email}:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many uploads, please try again later" }, { status: 429 });
  }

  const consented = await hasCurrentConsent(email, "voice_face_clone");
  if (!consented) {
    return NextResponse.json(
      { error: "consent_required", detail: "Voice/face cloning consent is required before uploading a sample" },
      { status: 403 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const name = typeof form.get("name") === "string" ? (form.get("name") as string).trim() : "";
  const kindRaw = form.get("kind");
  const ttsVoiceHint =
    typeof form.get("ttsVoiceHint") === "string" ? (form.get("ttsVoiceHint") as string).trim() : "";
  const preferredGenderRaw =
    typeof form.get("preferredGender") === "string" ? (form.get("preferredGender") as string).trim() : "auto";
  const preferredGender =
    preferredGenderRaw === "male" || preferredGenderRaw === "female" ? preferredGenderRaw : "auto";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!PROFILE_KINDS.has(kindRaw as ProfileKind)) {
    return NextResponse.json({ error: "kind must be voice, avatar, or both" }, { status: 400 });
  }
  const kind = kindRaw as ProfileKind;

  // Collect files: multi "files" + legacy single "file"
  const files: File[] = [];
  for (const entry of form.getAll("files")) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  const single = form.get("file");
  if (files.length === 0 && single instanceof File && single.size > 0) files.push(single);

  if (files.length === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} files per upload` }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `File too large (max 200MB): ${file.name}` }, { status: 400 });
    }
    const okType =
      file.type.startsWith("audio/") || file.type.startsWith("video/") || file.type.startsWith("image/");
    if (!okType) {
      return NextResponse.json(
        { error: `Unsupported type for ${file.name} — use image, audio, or video` },
        { status: 400 }
      );
    }
    if (file.type.startsWith("image/") && kind === "voice") {
      return NextResponse.json(
        { error: "Images cannot train a voice-only profile — use avatar or both" },
        { status: 400 }
      );
    }
    if (file.type.startsWith("audio/") && kind === "avatar") {
      return NextResponse.json(
        { error: "Audio cannot train a face-only profile — use voice or both" },
        { status: 400 }
      );
    }
  }

  const coverIndexRaw = form.get("coverIndex");
  let coverIndex = 0;
  if (typeof coverIndexRaw === "string" && coverIndexRaw !== "") {
    const n = Number.parseInt(coverIndexRaw, 10);
    if (!Number.isNaN(n) && n >= 0 && n < files.length) coverIndex = n;
  }

  const mediaBank: ProfileMediaItem[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name?.trim() || `sample-${Date.now()}.${file.type.split("/")[1] || "bin"}`;
    const storageRef = await uploadUserMedia(email, safeName, bytes, file.type || "application/octet-stream");
    mediaBank.push(
      buildMediaItem({
        provider: storageRef.provider,
        url: storageRef.url,
        mimeType: file.type || "application/octet-stream",
        label: file.name,
      })
    );
  }

  const cover = mediaBank[coverIndex] ?? mediaBank[0]!;
  const profile = await createProfile({
    email,
    name,
    kind,
    sourceMedia: { provider: cover.provider, url: cover.url },
    mediaBank,
    coverMediaId: cover.id,
    ttsVoiceHint:
      kind === "voice" || kind === "both"
        ? ttsVoiceHint || process.env.FREE_TTS_DEFAULT_VOICE?.trim() || "en-US-JennyNeural"
        : null,
  });

  const { updateProfile } = await import("@/lib/avatar-studio/profiles-store");
  let ready = await updateProfile(profile.id, { status: "ready" });

  // ── Real voice training: analyze sample → Gemini style profile ──
  let trainNote: string | null = null;
  if ((kind === "voice" || kind === "both") && files.some((f) => f.type.startsWith("audio/") || f.type.startsWith("video/"))) {
    try {
      const audioFile =
        files.find((f) => f.type.startsWith("audio/")) ??
        files.find((f) => f.type.startsWith("video/")) ??
        files[0]!;
      const audioBytes = Buffer.from(await audioFile.arrayBuffer());
      const { trainVoiceFromSample, isGeminiConfigured } = await import(
        "@/lib/avatar-studio/providers/gemini-tts"
      );
      if (isGeminiConfigured()) {
        const trained = await trainVoiceFromSample({
          audioBytes,
          mimeType: audioFile.type || "audio/mpeg",
          speakerName: name,
          preferredGender,
        });
        if (trained.ok) {
          ready = await updateProfile(profile.id, {
            status: "ready",
            geminiVoice: trained.profile.geminiVoice,
            voiceStylePrompt: trained.profile.stylePrompt,
            trainSummary: `${trained.profile.summary} [${trained.engine}]`,
          });
          trainNote = `Voice trained (${trained.engine}): ${trained.profile.summary} → ${trained.profile.geminiVoice}. Use this voice in Create.`;
        } else {
          trainNote = `Sample saved, but train failed (${trained.error}). Tap Train now in the library.`;
        }
      } else {
        trainNote =
          "Sample saved. Set GEMINI_API_KEY for automatic voice training (style matching).";
      }
    } catch (e) {
      trainNote = `Sample saved; training step error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  // Presenter portrait = cover image for free path
  if (cover.kind === "image" && cover.url) {
    try {
      const { updateUserSettings } = await import("@/lib/avatar-studio/user-settings-store");
      await updateUserSettings(email, { presenterPortraitUrl: cover.url });
    } catch {
      // non-fatal
    }
  }

  const storageNote =
    cover.provider === "google_drive"
      ? `Saved ${mediaBank.length} sample(s) to your Google Drive folder.`
      : `Saved ${mediaBank.length} sample(s) to app storage.`;

  return NextResponse.json(
    {
      profile: ready ?? profile,
      imageCount: mediaBank.filter((m) => m.kind === "image").length,
      mediaCount: mediaBank.length,
      coverMediaId: cover.id,
      trained: Boolean(ready?.geminiVoice && ready?.voiceStylePrompt),
      trainSummary: ready?.trainSummary ?? null,
      note: trainNote ? `${storageNote} ${trainNote}` : storageNote,
    },
    { status: 201 }
  );
}
