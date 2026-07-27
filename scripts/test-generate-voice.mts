/**
 * Integration: generateVoice free path + store audio (local storage adapter).
 */
import { generateVoice } from "../src/lib/avatar-studio/agents/voice-agent.ts";
import { freeVoiceEdgeName } from "../src/lib/avatar-studio/free-voices.ts";
import fs from "fs";
import path from "path";

const email = "test-voice@verlinlabs.local";
const script = "Hello. This verifies that Avatar Studio uses the selected multi country voice in generation.";

const cases = [
  "free:en-US-GuyNeural",
  "free:en-IN-NeerjaNeural",
  "free:en-GB-SoniaNeural",
];

const out: any[] = [];
for (const voiceProfileId of cases) {
  const r = await generateVoice(
    "edge-tts-free", // may not exist in catalog - check free model id
    script,
    "standard",
    voiceProfileId,
    email
  );
  out.push({
    voiceProfileId,
    expectedEdge: freeVoiceEdgeName(voiceProfileId),
    ok: r.ok,
    error: r.error,
    url: r.audioRef?.url ?? r.storageRef?.url ?? null,
    duration: r.durationSeconds,
  });
}

// Also try with catalog free model id from seed
const { listModels } = await import("../src/lib/avatar-studio/model-catalog.ts");
const models = await listModels();
const freeVoiceModel = models.find((m: any) => m.kind === "voice" && m.freeTierFallback) ?? models.find((m: any) => m.kind === "voice");
console.log("models", models.filter((m: any) => m.kind === "voice").map((m: any) => m.id));

const better: any[] = [];
if (freeVoiceModel) {
  for (const voiceProfileId of cases) {
    const r = await generateVoice(freeVoiceModel.id, script, "standard", voiceProfileId, email);
    better.push({
      voiceProfileId,
      modelId: freeVoiceModel.id,
      ok: r.ok,
      error: r.error,
      url: r.audioRef?.url ?? r.storageRef?.url ?? null,
      duration: r.durationSeconds,
      outputKind: r.outputKind,
    });
  }
}

const ok = better.length ? better.every((b) => b.ok && b.url) : out.every((b) => b.ok && b.url);
// distinct URLs
const urls = (better.length ? better : out).map((b) => b.url).filter(Boolean);
const distinctUrls = new Set(urls).size === urls.length;

console.log(JSON.stringify({ ok, distinctUrls, freeVoiceModel: freeVoiceModel?.id, out, better }, null, 2));
if (!ok || !distinctUrls) process.exit(1);
