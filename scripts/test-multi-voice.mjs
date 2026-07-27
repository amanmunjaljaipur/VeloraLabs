/**
 * End-to-end free multi-voice TTS verification (no Next server required).
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createHash } from "crypto";
import { createRequire } from "module";
import { Readable } from "stream";

const require = createRequire(import.meta.url);

// Inline free voice list (mirror free-voices.ts edge names)
const VOICES = [
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "en-GB-SoniaNeural",
  "en-IN-NeerjaNeural",
  "en-AU-NatashaNeural",
  "en-IE-ConnorNeural",
  "en-CA-ClaraNeural",
  "en-ZA-LeahNeural",
];

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    stream.on("close", () => { if (chunks.length) resolve(Buffer.concat(chunks)); });
  });
}

async function synth(voice, text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const buf = await Promise.race([
    streamToBuffer(audioStream),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 60000)),
  ]);
  try { tts.close(); } catch {}
  return buf;
}

const text = "Hello from Avatar Studio. Testing multi country neural voices.";
const results = [];
for (const v of VOICES) {
  try {
    const buf = await synth(v, text);
    results.push({
      voice: v,
      ok: buf.byteLength > 1000,
      bytes: buf.byteLength,
      md5: createHash("md5").update(buf).digest("hex").slice(0, 12),
      isMp3: buf[0] === 0xff || buf.slice(0, 3).toString() === "ID3",
    });
  } catch (e) {
    results.push({ voice: v, ok: false, error: String(e.message || e) });
  }
}

const hashes = results.filter((r) => r.md5).map((r) => r.md5);
const unique = new Set(hashes);
const allOk = results.every((r) => r.ok);
const allDistinct = unique.size === hashes.length;

console.log(JSON.stringify({ allOk, allDistinct, uniqueHashes: unique.size, total: results.length, results }, null, 2));
if (!allOk || !allDistinct) process.exit(1);
