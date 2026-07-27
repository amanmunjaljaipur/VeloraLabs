import { auth } from "@/auth";
import { synthesizeFreeVoice } from "@/lib/avatar-studio/providers/edge-tts";
import { freeVoiceEdgeName, getFreeVoicePreset, isFreeVoiceId } from "@/lib/avatar-studio/free-voices";
import { getProfile } from "@/lib/avatar-studio/profiles-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Preview a free system voice (short TTS) or a trained sample URL.
 * GET ?voiceId=free:en-US-JennyNeural
 * GET ?profileId=uuid
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-voice-preview:${session.user.email}:${ip}`, 40, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many previews — try again later" }, { status: 429 });
  }

  const voiceId = req.nextUrl.searchParams.get("voiceId");
  const profileId = req.nextUrl.searchParams.get("profileId");

  // Trained sample: return the stored media URL for client playback
  if (profileId) {
    const profile = await getProfile(profileId, session.user.email);
    if (!profile?.sourceMedia?.url) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }
    return NextResponse.json({
      kind: "sample",
      url: profile.sourceMedia.url,
      name: profile.name,
      mediaKind: profile.kind,
    });
  }

  if (!voiceId || !isFreeVoiceId(voiceId)) {
    return NextResponse.json({ error: "voiceId (free:…) or profileId required" }, { status: 400 });
  }

  const preset = getFreeVoicePreset(voiceId);
  const line = preset?.sampleLine ?? "Hello from Avatar Studio. This is a free voice preview.";
  const edge = freeVoiceEdgeName(voiceId);
  const synth = await synthesizeFreeVoice(line, edge);
  if (!synth.ok) {
    return NextResponse.json({ error: synth.error }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(synth.audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=300",
      "X-Voice-Id": voiceId,
      "X-Voice-Label": preset?.label ?? "Voice",
    },
  });
}
