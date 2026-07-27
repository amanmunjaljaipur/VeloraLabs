import { createHash } from "crypto";
import { FREE_VOICE_PRESETS, freeVoiceEdgeName, isFreeVoiceId, DEFAULT_FREE_VOICE_ID } from "../src/lib/avatar-studio/free-voices.ts";
import { synthesizeFreeVoice } from "../src/lib/avatar-studio/providers/edge-tts.ts";

const failures: string[] = [];

if (FREE_VOICE_PRESETS.length < 10) failures.push("Too few free voices");
const regions = new Set(FREE_VOICE_PRESETS.map((v) => v.region));
if (regions.size < 5) failures.push("Need 5+ countries, got " + regions.size);
for (const v of FREE_VOICE_PRESETS) {
  if (!v.edgeVoice || !v.id.startsWith("free:")) failures.push("Bad preset " + v.id);
  if (freeVoiceEdgeName(v.id) !== v.edgeVoice) failures.push("edge name mismatch " + v.id);
  if (!isFreeVoiceId(v.id)) failures.push("isFreeVoiceId false " + v.id);
}
if (freeVoiceEdgeName("en-IN-PrabhatNeural") !== "en-IN-PrabhatNeural") {
  failures.push("raw ShortName not passed through");
}
if (freeVoiceEdgeName(DEFAULT_FREE_VOICE_ID) !== "en-US-JennyNeural") {
  failures.push("default not Jenny");
}

const samples = ["free:en-US-GuyNeural", "free:en-IN-NeerjaNeural", "free:en-GB-RyanNeural"];
const hashes: string[] = [];
for (const id of samples) {
  const edge = freeVoiceEdgeName(id);
  const r = await synthesizeFreeVoice("Quick Avatar Studio voice selection test.", edge);
  if (!r.ok) {
    failures.push("synth failed " + id + " " + r.error);
    continue;
  }
  if (r.engine !== "msedge") failures.push("expected msedge got " + r.engine + " for " + id);
  if (r.voiceUsed !== edge) failures.push("voiceUsed mismatch " + r.voiceUsed + " vs " + edge);
  if (r.audio.byteLength < 1000) failures.push("audio too small " + id);
  hashes.push(createHash("md5").update(r.audio).digest("hex"));
}
if (new Set(hashes).size !== hashes.length) failures.push("wrapper produced identical audio");

const trainedHint = await synthesizeFreeVoice("Trained sample uses country neural hint.", "en-AU-NatashaNeural");
if (!trainedHint.ok || trainedHint.engine !== "msedge") {
  failures.push("trained hint synth failed " + (trainedHint.ok ? trainedHint.engine : trainedHint.error));
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  failures,
  catalogueSize: FREE_VOICE_PRESETS.length,
  regions: [...regions],
  sampleHashes: hashes.map((h) => h.slice(0, 12)),
  trainedHintBytes: trainedHint.ok ? trainedHint.audio.byteLength : 0,
  trainedEngine: trainedHint.ok ? trainedHint.engine : null,
}, null, 2));
if (failures.length) process.exit(1);
