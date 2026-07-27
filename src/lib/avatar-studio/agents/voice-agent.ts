import { getModel } from "@/lib/avatar-studio/model-catalog";
import type { GenerationResult } from "@/lib/avatar-studio/agents/types";
import { getUserSettings } from "@/lib/avatar-studio/user-settings-store";
import { synthesizeFreeVoice } from "@/lib/avatar-studio/providers/edge-tts";
import {
  isGeminiConfigured,
  synthesizeGeminiTts,
} from "@/lib/avatar-studio/providers/gemini-tts";
import { hostAudioBuffer } from "@/lib/avatar-studio/providers/presenter";
import { freeVoiceEdgeName, isFreeVoiceId } from "@/lib/avatar-studio/free-voices";
import {
  getProfile,
  getVoiceSampleUrl,
  updateProfile,
} from "@/lib/avatar-studio/profiles-store";
import { downloadMediaBytes } from "@/lib/avatar-studio/storage-adapter";
import { trainVoiceFromSample } from "@/lib/avatar-studio/providers/gemini-tts";
import { cloneVoiceWithXtts, isXttsAvailable } from "@/lib/avatar-studio/providers/xtts-clone";

/**
 * Voice Agent — priority for TRAINED voices:
 * 1) Open-source Coqui XTTS-v2 local clone from your sample (free, real cloning)
 * 2) Custom clone host with reference sample
 * 3) Gemini TTS with style profile learned from the training sample
 * 4) msedge multi-country neural fallback
 *
 * Free catalogue voices use Gemini (when keyed) or msedge.
 */

async function callCustomEndpoint(
  endpointUrl: string,
  label: string,
  script: string,
  qualityTier: string,
  voiceProfileId: string | null,
  referenceAudioUrl?: string | null
): Promise<GenerationResult> {
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: script,
        voiceProfileId,
        qualityTier,
        referenceAudioUrl: referenceAudioUrl ?? undefined,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.audioUrl) {
      return {
        ok: false,
        storageRef: null,
        durationSeconds: null,
        error: data?.error ?? `${label} endpoint rejected the request`,
      };
    }
    return {
      ok: true,
      storageRef: { provider: "blob", url: data.audioUrl },
      durationSeconds: data.durationSeconds ?? null,
      error: null,
      outputKind: "video",
      audioRef: { provider: "blob", url: data.audioUrl },
    };
  } catch (error) {
    console.error("[avatar-studio/voice-agent] custom endpoint failed", error);
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: `Could not reach the ${label} endpoint`,
    };
  }
}

async function hostBuffer(
  userEmail: string,
  audio: Buffer,
  filename: string,
  durationSeconds: number,
  meta: { engine: string; voiceUsed: string }
): Promise<GenerationResult> {
  try {
    const audioRef = await hostAudioBuffer(userEmail, audio, filename);
    console.info(
      "[avatar-studio/voice-agent] stored",
      meta.engine,
      "voice=",
      meta.voiceUsed,
      "url=",
      audioRef.url,
      "bytes=",
      audio.byteLength
    );
    return {
      ok: true,
      storageRef: audioRef,
      durationSeconds,
      error: null,
      outputKind: "presenter",
      audioRef,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: `Could not store voice audio (${detail})`,
    };
  }
}

async function hostFreeEdge(
  userEmail: string,
  script: string,
  edgeVoice: string,
  tag: string
): Promise<GenerationResult> {
  const synth = await synthesizeFreeVoice(script, edgeVoice);
  if (!synth.ok) {
    return { ok: false, storageRef: null, durationSeconds: null, error: synth.error };
  }
  const safe = synth.voiceUsed.replace(/[^a-zA-Z0-9_-]/g, "_");
  return hostBuffer(userEmail, synth.audio, `voice-${tag}-${safe}-${Date.now()}.mp3`, synth.durationSeconds, {
    engine: synth.engine,
    voiceUsed: synth.voiceUsed,
  });
}

async function hostGemini(
  userEmail: string,
  script: string,
  voiceName: string,
  stylePrompt: string | null,
  tag: string
): Promise<GenerationResult> {
  const synth = await synthesizeGeminiTts(script, { voiceName, stylePrompt });
  if (!synth.ok) {
    return { ok: false, storageRef: null, durationSeconds: null, error: synth.error };
  }
  const ext = synth.mimeType.includes("mpeg") ? "mp3" : "wav";
  const safe = synth.voiceUsed.replace(/[^a-zA-Z0-9_-]/g, "_");
  return hostBuffer(
    userEmail,
    synth.audio,
    `voice-${tag}-${safe}-${Date.now()}.${ext}`,
    synth.durationSeconds,
    { engine: synth.engine, voiceUsed: synth.voiceUsed }
  );
}

/** Ensure trained profile has Gemini style profile; train on the fly if missing. */
async function ensureTrainedStyle(
  profileId: string,
  userEmail: string,
  sampleUrl: string | null,
  speakerName: string
): Promise<{ geminiVoice: string; stylePrompt: string } | null> {
  const profile = await getProfile(profileId, userEmail);
  if (!profile) return null;
  if (profile.geminiVoice && profile.voiceStylePrompt) {
    return { geminiVoice: profile.geminiVoice, stylePrompt: profile.voiceStylePrompt };
  }
  if (!sampleUrl || !isGeminiConfigured()) return null;

  const dl = await downloadMediaBytes(sampleUrl);
  if (!dl.ok) {
    console.warn("[avatar-studio/voice-agent] could not download sample for train", dl.error);
    return null;
  }

  console.info("[avatar-studio/voice-agent] training voice style from sample…", speakerName);
  const trained = await trainVoiceFromSample({
    audioBytes: dl.bytes,
    mimeType: dl.mimeType,
    speakerName,
  });
  if (!trained.ok) {
    console.warn("[avatar-studio/voice-agent] train failed", trained.error);
    return null;
  }

  await updateProfile(profileId, {
    geminiVoice: trained.profile.geminiVoice,
    voiceStylePrompt: trained.profile.stylePrompt,
    trainSummary: trained.profile.summary,
    status: "ready",
  });

  return {
    geminiVoice: trained.profile.geminiVoice,
    stylePrompt: trained.profile.stylePrompt,
  };
}

export async function generateVoice(
  voiceModelId: string,
  script: string,
  qualityTier: string,
  voiceProfileId: string | null,
  userEmail?: string
): Promise<GenerationResult> {
  const model = await getModel(voiceModelId);
  if (!model || model.kind !== "voice") {
    return { ok: false, storageRef: null, durationSeconds: null, error: "Unknown voice model" };
  }

  if (!userEmail) {
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: "Voice generation requires a signed-in user",
    };
  }

  const selectedKey = voiceProfileId?.trim() || null;
  console.info("[avatar-studio/voice-agent] generateVoice selected=", selectedKey, "model=", voiceModelId);

  // ── 1) Free catalogue voice (free:…) ──
  if (isFreeVoiceId(selectedKey) && selectedKey) {
    // Prefer Gemini multi-voice when available (higher quality / distinct)
    if (isGeminiConfigured()) {
      // Map free edge id → a gemini voice via stable hash of id
      const { GEMINI_VOICES } = await import("@/lib/avatar-studio/providers/gemini-tts");
      const idx =
        Math.abs(
          selectedKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
        ) % GEMINI_VOICES.length;
      // Better: explicit map for common free ids
      const map: Record<string, string> = {
        "free:en-US-JennyNeural": "Kore",
        "free:en-US-GuyNeural": "Charon",
        "free:en-US-AriaNeural": "Aoede",
        "free:en-US-ChristopherNeural": "Orus",
        "free:en-GB-SoniaNeural": "Sulafat",
        "free:en-GB-RyanNeural": "Algenib",
        "free:en-GB-LibbyNeural": "Leda",
        "free:en-IN-NeerjaNeural": "Achernar",
        "free:en-IN-PrabhatNeural": "Fenrir",
        "free:en-AU-NatashaNeural": "Puck",
        "free:en-AU-WilliamNeural": "Schedar",
        "free:en-IE-EmilyNeural": "Zephyr",
        "free:en-IE-ConnorNeural": "Erinome",
        "free:en-CA-ClaraNeural": "Autonoe",
        "free:en-CA-LiamNeural": "Gacrux",
        "free:en-ZA-LeahNeural": "Umbriel",
        "free:en-ZA-LukeNeural": "Algenib",
      };
      const gVoice = map[selectedKey] || GEMINI_VOICES[idx]!.id;
      const edge = freeVoiceEdgeName(selectedKey);
      const region = edge.match(/^([a-z]{2}-[A-Z]{2})/i)?.[1] || "en-US";
      const style = `Speak with a natural ${region} English accent and clear video-narration tone.`;
      const gem = await hostGemini(userEmail, script, gVoice, style, "free-gemini");
      if (gem.ok) return gem;
      console.warn("[avatar-studio/voice-agent] Gemini free voice failed, msedge fallback", gem.error);
    }
    const edgeVoice = freeVoiceEdgeName(selectedKey);
    return hostFreeEdge(userEmail, script, edgeVoice, "free-edge");
  }

  // ── 2) Trained profile UUID — THIS is the training path ──
  let referenceAudioUrl: string | null = null;
  let ttsHint: string | null = null;
  let profileName = "Speaker";
  if (selectedKey && !isFreeVoiceId(selectedKey)) {
    const profile = await getProfile(selectedKey, userEmail);
    if (profile && (profile.kind === "voice" || profile.kind === "both")) {
      referenceAudioUrl = getVoiceSampleUrl(profile);
      ttsHint = profile.ttsVoiceHint;
      profileName = profile.name;
      console.info(
        "[avatar-studio/voice-agent] trained profile",
        profile.name,
        "sample=",
        Boolean(referenceAudioUrl),
        "geminiVoice=",
        profile.geminiVoice,
        "hasStyle=",
        Boolean(profile.voiceStylePrompt)
      );
    } else {
      console.warn("[avatar-studio/voice-agent] trained voice not found", selectedKey);
    }
  }

  // 2a) Open-source free XTTS-v2 zero-shot clone from the user's sample (priority)
  if (selectedKey && !isFreeVoiceId(selectedKey) && referenceAudioUrl) {
    const xttsReady = await isXttsAvailable();
    if (xttsReady.ok) {
      console.info("[avatar-studio/voice-agent] XTTS clone starting…", xttsReady);
      const cloned = await cloneVoiceWithXtts({
        text: script,
        speakerUrl: referenceAudioUrl,
        language: "en",
      });
      if (cloned.ok) {
        return hostBuffer(
          userEmail,
          cloned.audio,
          `voice-xtts-clone-${Date.now()}.wav`,
          cloned.durationSeconds,
          { engine: `xtts-${cloned.device}`, voiceUsed: `clone:${profileName}` }
        );
      }
      console.warn("[avatar-studio/voice-agent] XTTS clone failed:", cloned.error);
    } else {
      console.warn(
        "[avatar-studio/voice-agent] XTTS not installed — run: pip install TTS torch torchaudio",
        xttsReady.error
      );
    }
  }

  // 2b) Custom clone host with reference (best quality when user configured it)
  const settings = await getUserSettings(userEmail);
  if (settings.voiceMode === "custom_url" && settings.voiceEndpointUrl) {
    const custom = await callCustomEndpoint(
      settings.voiceEndpointUrl,
      "Your custom voice",
      script,
      qualityTier,
      selectedKey,
      referenceAudioUrl
    );
    if (custom.ok) return custom;
    console.warn("[avatar-studio/voice-agent] custom voice failed:", custom.error);
  }

  const endpointUrl = process.env[model.endpointEnvVar];
  if (endpointUrl) {
    const platform = await callCustomEndpoint(
      endpointUrl,
      model.label,
      script,
      qualityTier,
      selectedKey,
      referenceAudioUrl
    );
    if (platform.ok) return platform;
  }

  const cloneUrl = process.env.VOICE_CLONE_ENDPOINT_URL?.trim();
  if (cloneUrl && referenceAudioUrl) {
    const cloned = await callCustomEndpoint(
      cloneUrl,
      "Voice clone host",
      script,
      qualityTier,
      selectedKey,
      referenceAudioUrl
    );
    if (cloned.ok) return cloned;
  }

  // 2c) Gemini trained path — analyze sample if needed, then speak with style
  if (selectedKey && !isFreeVoiceId(selectedKey) && isGeminiConfigured()) {
    const style = await ensureTrainedStyle(selectedKey, userEmail, referenceAudioUrl, profileName);
    if (style) {
      const gem = await hostGemini(
        userEmail,
        script,
        style.geminiVoice,
        style.stylePrompt,
        "trained-gemini"
      );
      if (gem.ok) return gem;
      console.warn("[avatar-studio/voice-agent] Gemini trained synth failed", gem.error);
    }
  }

  // 2d) Edge fallback for trained (use ttsVoiceHint, never silent Jenny-only)
  const edgeVoice = freeVoiceEdgeName(
    ttsHint || process.env.FREE_TTS_DEFAULT_VOICE || "en-US-JennyNeural"
  );
  return hostFreeEdge(userEmail, script, edgeVoice, "trained-edge");
}
