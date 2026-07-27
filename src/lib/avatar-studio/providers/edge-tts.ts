/**
 * Free multi-voice neural TTS via Microsoft Edge Read Aloud (WebSocket).
 *
 * The old HTTP synthesize endpoint returns 404 — all voices then fell back to
 * Google Translate TTS (one generic voice). This module uses `msedge-tts`,
 * which speaks with real different neural voices (US/UK/IN/AU/IE/CA/ZA…).
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "stream";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function chunkText(text: string, maxChars: number): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks: string[] = [];
  let remaining = cleaned;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf(". ", maxChars);
    if (cut < maxChars * 0.4) cut = remaining.lastIndexOf(" ", maxChars);
    if (cut < maxChars * 0.3) cut = maxChars;
    chunks.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  return chunks.filter(Boolean);
}

export function localeFromEdgeVoice(voice: string): string {
  const m = voice.match(/^([a-z]{2}-[A-Z]{2})/i);
  return m?.[1] ?? "en-US";
}

export function estimateMp3DurationSeconds(bytes: number, wordCountHint?: number): number {
  // Edge 24kHz 48kbps mono ≈ 6KB/s
  const fromBytes = Math.max(1, Math.round(bytes / 6000));
  if (wordCountHint && wordCountHint > 0) {
    const fromWords = Math.max(1, Math.round((wordCountHint / 145) * 60));
    return Math.max(1, Math.round(fromBytes * 0.45 + fromWords * 0.55));
  }
  return fromBytes;
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    // Some versions emit "close" without "end"
    stream.on("close", () => {
      if (chunks.length) resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Synthesize one chunk with msedge-tts WebSocket (real neural multi-voice).
 */
async function synthesizeChunkMsEdge(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const buf = await Promise.race([
    streamToBuffer(audioStream as Readable),
    new Promise<Buffer>((_, reject) =>
      setTimeout(() => reject(new Error("msedge-tts stream timeout")), 90_000)
    ),
  ]);
  try {
    tts.close();
  } catch {
    /* ignore */
  }
  if (!buf || buf.byteLength < 200) {
    throw new Error(`Empty audio for voice ${voice}`);
  }
  return buf;
}

/**
 * Full-script free neural TTS. Uses the selected Edge ShortName only —
 * no silent rewrite to a single Google voice.
 */
export async function synthesizeFreeVoice(
  text: string,
  voice = "en-US-JennyNeural"
): Promise<
  | {
      ok: true;
      audio: Buffer;
      durationSeconds: number;
      engine: "msedge" | "gtts";
      voiceUsed: string;
    }
  | { ok: false; error: string }
> {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return { ok: false, error: "Script is empty" };
  const resolvedVoice = voice.trim() || "en-US-JennyNeural";
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  try {
    // Chunk long scripts so WebSocket stays reliable
    const chunks = chunkText(cleaned, 1200);
    const parts: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          parts.push(await synthesizeChunkMsEdge(chunk, resolvedVoice));
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        }
      }
      if (lastErr) {
        throw lastErr instanceof Error
          ? lastErr
          : new Error(`Voice synthesis failed for ${resolvedVoice}`);
      }
      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 80));
    }

    const audio = Buffer.concat(parts);
    console.info(
      "[tts] msedge ok voice=",
      resolvedVoice,
      "chunks=",
      chunks.length,
      "bytes=",
      audio.byteLength
    );
    return {
      ok: true,
      audio,
      durationSeconds: estimateMp3DurationSeconds(audio.byteLength, wordCount),
      engine: "msedge",
      voiceUsed: resolvedVoice,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[tts] msedge failed for", resolvedVoice, msg);

    // Emergency only: Google TTS — ONE generic English voice (not multi-speaker).
    // We still return it so jobs don't hard-fail, but label engine=gtts so UI/logs know.
    try {
      const audio = await synthesizeGoogleChunksEmergency(cleaned);
      console.warn(
        "[tts] EMERGENCY gTTS fallback — all regional voices sound the same on this path. msedge error:",
        msg
      );
      return {
        ok: true,
        audio,
        durationSeconds: estimateMp3DurationSeconds(audio.byteLength, wordCount),
        engine: "gtts",
        voiceUsed: resolvedVoice,
      };
    } catch (e2) {
      return {
        ok: false,
        error: `Voice generation failed (${resolvedVoice}): ${msg}`,
      };
    }
  }
}

/** Last-resort single-voice fallback (not used for multi-accent product path). */
async function synthesizeGoogleChunksEmergency(text: string): Promise<Buffer> {
  const chunks = chunkText(text, 180);
  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`gTTS ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 100) throw new Error("gTTS empty");
    parts.push(buf);
    await new Promise((r) => setTimeout(r, 100));
  }
  return Buffer.concat(parts);
}

/** Escape helper if callers build SSML */
export { escapeXml };
