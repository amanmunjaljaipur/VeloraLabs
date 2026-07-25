import type { TranscriptSegment } from "@/lib/avatar-studio/jobs-store";
import { randomUUID } from "crypto";

/**
 * Transcript Agent: powers the transcript-based editor (Section 8). Real
 * STT (faster-whisper) needs a GPU host this sandbox doesn't have, so this
 * agent prefers a configured endpoint (TRANSCRIPT_FASTER_WHISPER_ENDPOINT_URL)
 * when set, but - unlike Voice/Avatar - degrades to a genuinely useful
 * fallback rather than a bare error: since the video was generated FROM a
 * known script, this agent can sentence-split that script and estimate
 * per-segment timestamps from speaking-rate, producing a real, editable
 * transcript immediately. It just won't be audio-aligned to the word until
 * a real STT endpoint takes over.
 *
 * Expected endpoint contract (implement this on your GPU host):
 *   POST {TRANSCRIPT_FASTER_WHISPER_ENDPOINT_URL}
 *   body: { audioUrl: string }
 *   response: { segments: {startMs, endMs, text}[] } | { error: string }
 */

const WORDS_PER_MINUTE = 150;
const MS_PER_MINUTE = 60_000;

function estimateSegmentsFromScript(script: string): TranscriptSegment[] {
  const sentences = script
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  let cursorMs = 0;
  return sentences.map((text) => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const durationMs = Math.max(500, (wordCount / WORDS_PER_MINUTE) * MS_PER_MINUTE);
    const segment: TranscriptSegment = {
      id: randomUUID(),
      startMs: Math.round(cursorMs),
      endMs: Math.round(cursorMs + durationMs),
      text,
      dirty: false,
    };
    cursorMs += durationMs;
    return segment;
  });
}

export async function generateTranscript(script: string, audioUrl: string | null): Promise<TranscriptSegment[]> {
  const endpointUrl = process.env.TRANSCRIPT_FASTER_WHISPER_ENDPOINT_URL;
  if (endpointUrl && audioUrl) {
    try {
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.segments)) {
        return data.segments.map((s: { startMs: number; endMs: number; text: string }) => ({
          id: randomUUID(),
          startMs: s.startMs,
          endMs: s.endMs,
          text: s.text,
          dirty: false,
        }));
      }
      console.error("[avatar-studio/transcript-agent] STT endpoint returned unusable data, falling back to estimate");
    } catch (error) {
      console.error("[avatar-studio/transcript-agent] STT endpoint call failed, falling back to estimate", error);
    }
  }
  return estimateSegmentsFromScript(script);
}
