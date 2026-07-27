/**
 * Gemini native TTS — multi-voice + style-controlled speech.
 * Used for free catalogue voices and for trained-sample style matching.
 * Requires GEMINI_API_KEY (already used elsewhere in the app).
 */

import fs from "fs";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const GEMINI_TTS_MODEL =
  process.env.GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";

/** Official Gemini TTS prebuilt voices (subset we ship in UI). */
export const GEMINI_VOICES = [
  { id: "Kore", label: "Kore", tagline: "Firm · clear" },
  { id: "Puck", label: "Puck", tagline: "Upbeat · lively" },
  { id: "Charon", label: "Charon", tagline: "Informative · steady" },
  { id: "Fenrir", label: "Fenrir", tagline: "Excitable · bold" },
  { id: "Aoede", label: "Aoede", tagline: "Breezy · light" },
  { id: "Leda", label: "Leda", tagline: "Youthful" },
  { id: "Orus", label: "Orus", tagline: "Firm · deep" },
  { id: "Zephyr", label: "Zephyr", tagline: "Bright" },
  { id: "Autonoe", label: "Autonoe", tagline: "Bright · warm" },
  { id: "Umbriel", label: "Umbriel", tagline: "Easy-going" },
  { id: "Erinome", label: "Erinome", tagline: "Clear · neutral" },
  { id: "Algenib", label: "Algenib", tagline: "Gravelly · deep" },
  { id: "Achernar", label: "Achernar", tagline: "Soft" },
  { id: "Gacrux", label: "Gacrux", tagline: "Mature" },
  { id: "Sulafat", label: "Sulafat", tagline: "Warm" },
  { id: "Schedar", label: "Schedar", tagline: "Even · professional" },
] as const;

export type GeminiVoiceId = (typeof GEMINI_VOICES)[number]["id"];

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function apiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() || "";
}

/** Wrap raw L16 mono PCM in a WAV container. */
export function pcmL16ToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function runFfmpeg(args: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const bin = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ok: false, error: "ffmpeg timeout" });
    }, 60_000);
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (e) => {
      clearTimeout(t);
      resolve({ ok: false, error: e.message });
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolve(code === 0 ? { ok: true } : { ok: false, error: stderr.slice(-300) });
    });
  });
}

/** Convert WAV/PCM buffer to MP3 when ffmpeg is available. */
export async function wavToMp3(wav: Buffer): Promise<Buffer> {
  const dir = path.join(os.tmpdir(), `gtts-${randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  const inPath = path.join(dir, "in.wav");
  const outPath = path.join(dir, "out.mp3");
  try {
    fs.writeFileSync(inPath, wav);
    const r = await runFfmpeg([
      "-y",
      "-i",
      inPath,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "128k",
      outPath,
    ]);
    if (r.ok && fs.existsSync(outPath)) {
      return fs.readFileSync(outPath);
    }
    // Return WAV if ffmpeg missing — still playable
    return wav;
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

export interface GeminiSynthResult {
  ok: true;
  audio: Buffer;
  mimeType: string;
  durationSeconds: number;
  voiceUsed: string;
  engine: "gemini-tts";
}

export async function synthesizeGeminiTts(
  text: string,
  opts: {
    voiceName?: string;
    /** Natural-language director notes (accent, tone, pace) */
    stylePrompt?: string | null;
  } = {}
): Promise<GeminiSynthResult | { ok: false; error: string }> {
  const key = apiKey();
  if (!key) return { ok: false, error: "GEMINI_API_KEY not configured" };

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return { ok: false, error: "Script is empty" };

  const voiceName = opts.voiceName?.trim() || "Kore";
  const style = opts.stylePrompt?.trim();
  // Gemini TTS is controllable via natural language in the prompt
  const spoken = style
    ? `${style}\n\nSpeak the following transcript exactly, clearly, for a video narration:\n\n${cleaned}`
    : `Speak the following transcript clearly for a video narration:\n\n${cleaned}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: spoken }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      candidates?: {
        content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
      }[];
    };
    if (!res.ok || data?.error) {
      return {
        ok: false,
        error: data?.error?.message || `Gemini TTS HTTP ${res.status}`,
      };
    }
    const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) {
      return { ok: false, error: "Gemini TTS returned no audio" };
    }
    const pcm = Buffer.from(inline.data, "base64");
    if (pcm.byteLength < 500) return { ok: false, error: "Gemini TTS audio too short" };

    // Parse rate from mime if present
    let rate = 24000;
    const mime = inline.mimeType || "audio/L16;codec=pcm;rate=24000";
    const rateMatch = mime.match(/rate=(\d+)/i);
    if (rateMatch) rate = Number(rateMatch[1]) || 24000;

    const wav = pcmL16ToWav(pcm, rate);
    const mp3OrWav = await wavToMp3(wav);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

    return {
      ok: true,
      audio: mp3OrWav,
      mimeType: mp3OrWav[0] === 0xff || mp3OrWav.slice(0, 3).toString() === "ID3" ? "audio/mpeg" : "audio/wav",
      durationSeconds,
      voiceUsed: voiceName,
      engine: "gemini-tts",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gemini TTS failed",
    };
  }
}

export interface VoiceTrainProfile {
  geminiVoice: string;
  stylePrompt: string;
  gender: string;
  accent: string;
  summary: string;
}

/** Local heuristic train when Gemini analysis is unavailable (always works). */
export function trainVoiceHeuristic(input: {
  audioBytes: Buffer;
  speakerName?: string;
  preferredGender?: "male" | "female" | "auto";
}): VoiceTrainProfile {
  // Rough energy / brightness from raw bytes (works for mp3 as a weak signal)
  const sample = input.audioBytes.subarray(0, Math.min(input.audioBytes.length, 80_000));
  let sum = 0;
  let hi = 0;
  for (let i = 0; i < sample.length; i++) {
    const v = sample[i]!;
    sum += v;
    if (v > 180) hi++;
  }
  const mean = sum / Math.max(1, sample.length);
  const brightness = hi / Math.max(1, sample.length);
  let gender: "male" | "female" | "neutral" = "neutral";
  if (input.preferredGender === "male" || input.preferredGender === "female") {
    gender = input.preferredGender;
  } else if (mean < 95 || brightness < 0.08) gender = "male";
  else if (mean > 120 || brightness > 0.18) gender = "female";

  const maleVoices = ["Orus", "Charon", "Algenib", "Fenrir", "Gacrux", "Schedar"] as const;
  const femaleVoices = ["Kore", "Aoede", "Leda", "Zephyr", "Achernar", "Sulafat", "Autonoe"] as const;
  const pool = gender === "male" ? maleVoices : gender === "female" ? femaleVoices : [...maleVoices, ...femaleVoices];
  const pick =
    pool[
      Math.abs(
        (input.speakerName || "speaker").split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      ) % pool.length
    ]!;

  const name = input.speakerName || "Speaker";
  return {
    geminiVoice: pick,
    stylePrompt: `# AUDIO PROFILE: ${name}
## Trained presenter
### DIRECTOR'S NOTES
Style: Clear video narrator matching the uploaded sample for ${name}.
Gender presentation: ${gender}.
Pace: Natural conversational pace, professional but friendly.
Accent: Match the speaker sample as closely as possible; natural spoken English.
Dynamics: Clean projection without shouting; suitable for avatar video voice-over.
#### TRANSCRIPT
`,
    gender,
    accent: "matched to sample",
    summary: `${gender} voice profile → ${pick}`,
  };
}

/**
 * Train a reusable voice profile from a sample.
 * 1) Gemini audio analysis when quota allows
 * 2) Local heuristic fallback (always succeeds)
 */
export async function trainVoiceFromSample(input: {
  audioBytes: Buffer;
  mimeType: string;
  speakerName?: string;
  preferredGender?: "male" | "female" | "auto";
}): Promise<{ ok: true; profile: VoiceTrainProfile; engine: "gemini" | "heuristic" } | { ok: false; error: string }> {
  const key = apiKey();

  if (key && input.audioBytes.byteLength > 500) {
    const voiceList = GEMINI_VOICES.map((v) => v.id).join(", ");
    const prompt = `You are a voice casting director. Listen to this speaker sample carefully.
Return ONLY valid JSON (no markdown) with keys:
{
  "gender": "male|female|neutral",
  "accent": "short accent/region description",
  "pitch": "low|medium|high",
  "pace": "slow|medium|fast",
  "tone": "short tone description",
  "geminiVoice": "ONE name from: ${voiceList}",
  "stylePrompt": "2-4 sentences of director notes so TTS sounds like THIS speaker (accent, age feel, energy, pitch). Include AUDIO PROFILE and DIRECTOR NOTES.",
  "summary": "one line summary"
}
Speaker name hint: ${input.speakerName || "unknown"}.
Pick geminiVoice that best matches gender/energy (deeper male → Orus/Algenib/Charon; bright female → Aoede/Leda/Zephyr).`;

    let bytes = input.audioBytes;
    if (bytes.byteLength > 3_500_000) bytes = bytes.subarray(0, 3_500_000);
    const b64 = bytes.toString("base64");
    const mime = input.mimeType || "audio/mpeg";
    // Prefer flash-lite for lower quota pressure
    const model =
      process.env.GEMINI_VOICE_TRAIN_MODEL?.trim() ||
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-2.0-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mime, data: b64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (res.ok && !data?.error) {
        const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
          const geminiVoice =
            GEMINI_VOICES.find((v) => v.id.toLowerCase() === String(parsed.geminiVoice || "").toLowerCase())
              ?.id || "Kore";
          const stylePrompt =
            typeof parsed.stylePrompt === "string" && parsed.stylePrompt.trim()
              ? parsed.stylePrompt.trim()
              : `Speak like a ${parsed.gender || "neutral"} speaker with ${parsed.accent || "neutral"} accent.`;
          return {
            ok: true,
            engine: "gemini",
            profile: {
              geminiVoice,
              stylePrompt,
              gender: parsed.gender || "neutral",
              accent: parsed.accent || "neutral",
              summary: parsed.summary || "Trained voice profile",
            },
          };
        }
      } else {
        console.warn("[gemini-tts] train analysis failed, using heuristic", data?.error?.message || res.status);
      }
    } catch (e) {
      console.warn("[gemini-tts] train analysis error, using heuristic", e);
    }
  }

  // Always-available fallback so Train never fails
  return {
    ok: true,
    engine: "heuristic",
    profile: trainVoiceHeuristic({
      audioBytes: input.audioBytes,
      speakerName: input.speakerName,
      preferredGender: input.preferredGender,
    }),
  };
}
