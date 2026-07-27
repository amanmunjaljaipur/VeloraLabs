import { auth } from "@/auth";
import {
  deleteProfile,
  getProfile,
  setCoverMedia,
  updateProfile,
  removeMediaFromProfile,
} from "@/lib/avatar-studio/profiles-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await getProfile(id, session.user.email);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

/**
 * PATCH: rename character, set cover image, or remove one media item.
 * Body JSON:
 *   { name?: string }
 *   { coverMediaId: string }
 *   { removeMediaId: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    coverMediaId?: string;
    removeMediaId?: string;
    ttsVoiceHint?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const existing = await getProfile(id, email);
  if (!existing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (typeof body.ttsVoiceHint === "string" || body.ttsVoiceHint === null) {
    const hint =
      typeof body.ttsVoiceHint === "string" && body.ttsVoiceHint.trim()
        ? body.ttsVoiceHint.trim()
        : null;
    const updated = await updateProfile(id, { ttsVoiceHint: hint });
    return NextResponse.json({ profile: updated });
  }

  // Re-run voice training on existing sample
  if ((body as { retrain?: boolean }).retrain === true) {
    const { getVoiceSampleUrl } = await import("@/lib/avatar-studio/profiles-store");
    const { downloadMediaBytes } = await import("@/lib/avatar-studio/storage-adapter");
    const { trainVoiceFromSample, isGeminiConfigured } = await import(
      "@/lib/avatar-studio/providers/gemini-tts"
    );
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "GEMINI_API_KEY required for voice training" }, { status: 503 });
    }
    const sampleUrl = getVoiceSampleUrl(existing);
    if (!sampleUrl) {
      return NextResponse.json({ error: "No audio sample on this profile" }, { status: 400 });
    }
    const dl = await downloadMediaBytes(sampleUrl);
    if (!dl.ok) return NextResponse.json({ error: dl.error }, { status: 400 });
    const trained = await trainVoiceFromSample({
      audioBytes: dl.bytes,
      mimeType: dl.mimeType,
      speakerName: existing.name,
    });
    if (!trained.ok) return NextResponse.json({ error: trained.error }, { status: 502 });
    const updated = await updateProfile(id, {
      geminiVoice: trained.profile.geminiVoice,
      voiceStylePrompt: trained.profile.stylePrompt,
      trainSummary: trained.profile.summary,
      status: "ready",
    });
    return NextResponse.json({ profile: updated, trained: true });
  }

  if (body.removeMediaId) {
    if (existing.mediaBank.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last image — delete the character instead, or add another first" },
        { status: 400 }
      );
    }
    const updated = await removeMediaFromProfile(id, email, body.removeMediaId);
    if (!updated) return NextResponse.json({ error: "Could not remove media" }, { status: 400 });
    return NextResponse.json({ profile: updated });
  }

  if (body.coverMediaId) {
    const updated = await setCoverMedia(id, email, body.coverMediaId);
    if (!updated) return NextResponse.json({ error: "Media not found in this character" }, { status: 404 });

    // Keep free presenter portrait aligned with cover when it's an image
    const cover = updated.mediaBank.find((m) => m.id === updated.coverMediaId);
    if (cover?.kind === "image" && cover.url) {
      try {
        const { updateUserSettings } = await import("@/lib/avatar-studio/user-settings-store");
        await updateUserSettings(email, { presenterPortraitUrl: cover.url });
      } catch {
        /* non-fatal */
      }
    }
    return NextResponse.json({ profile: updated });
  }

  if (typeof body.name === "string" && body.name.trim()) {
    const updated = await updateProfile(id, { name: body.name.trim() });
    return NextResponse.json({ profile: updated });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteProfile(id, session.user.email);
  if (!ok) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
