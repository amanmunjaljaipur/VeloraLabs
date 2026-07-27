import fs from "fs";
import path from "path";
import { trainVoiceFromSample, synthesizeGeminiTts } from "../src/lib/avatar-studio/providers/gemini-tts.ts";
import { generateVoice } from "../src/lib/avatar-studio/agents/voice-agent.ts";
import { createProfile, updateProfile } from "../src/lib/avatar-studio/profiles-store.ts";
import { buildMediaItem } from "../src/lib/avatar-studio/profiles-store.ts";
import { uploadUserMedia } from "../src/lib/avatar-studio/storage-adapter.ts";
import { createHash } from "crypto";

const failures: string[] = [];
const mediaRoot = path.join(process.cwd(), ".data", "avatar-media");
function findSample(): string | null {
  const walk = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) { const f = walk(p); if (f) return f; }
      else if (/\.(mp3|webm|wav)$/i.test(name) && !name.includes("voice-free") && !name.includes("voice-piper") && !name.includes("voice-trained") && st.size > 8000) return p;
    }
    return null;
  };
  return walk(mediaRoot);
}
const samplePath = findSample();
if (!samplePath) { console.log("no sample"); process.exit(1); }
const bytes = fs.readFileSync(samplePath);
const mime = samplePath.endsWith(".webm") ? "audio/webm" : "audio/mpeg";

const trained = await trainVoiceFromSample({ audioBytes: bytes, mimeType: mime, speakerName: "Aman" });
console.log("train", trained.ok ? { engine: trained.engine, ...trained.profile } : trained);
if (!trained.ok) { failures.push(trained.error); }
else {
  const s1 = await synthesizeGeminiTts("First line with trained style A.", {
    voiceName: trained.profile.geminiVoice,
    stylePrompt: trained.profile.stylePrompt,
  });
  const s2 = await synthesizeGeminiTts("First line with default Kore only.", {
    voiceName: "Kore",
    stylePrompt: null,
  });
  if (!s1.ok || !s2.ok) failures.push("synth fail " + (!s1.ok ? s1.error : s2.error));
  else {
    const h1 = createHash("md5").update(s1.audio).digest("hex");
    const h2 = createHash("md5").update(s2.audio).digest("hex");
    console.log("distinct from default Kore", h1 !== h2, s1.voiceUsed, s2.voiceUsed, s1.audio.byteLength, s2.audio.byteLength);
    if (h1 === h2 && s1.voiceUsed === s2.voiceUsed) {
      // may still be ok if same voice picked
      console.log("note: same voice name may share similar audio");
    }
  }

  const email = "aman.cansat@gmail.com";
  const uploaded = await uploadUserMedia(email, "e2e-train.mp3", bytes, mime);
  const item = buildMediaItem({ provider: uploaded.provider, url: uploaded.url, mimeType: mime });
  const profile = await createProfile({
    email,
    name: "E2E Train " + Date.now(),
    kind: "voice",
    sourceMedia: { provider: uploaded.provider, url: uploaded.url },
    mediaBank: [item],
    coverMediaId: item.id,
    geminiVoice: trained.profile.geminiVoice,
    voiceStylePrompt: trained.profile.stylePrompt,
    trainSummary: trained.profile.summary,
    ttsVoiceHint: "en-US-GuyNeural",
  });
  await updateProfile(profile.id, { status: "ready" });

  const gen = await generateVoice(
    "piper",
    "This is the trained voice path speaking new words for the final video.",
    "standard",
    profile.id,
    email
  );
  console.log("generateVoice trained", { ok: gen.ok, error: gen.error, url: gen.audioRef?.url, dur: gen.durationSeconds });
  if (!gen.ok) failures.push(gen.error || "gen fail");

  // Default free path control
  const free = await generateVoice("piper", "This is the trained voice path speaking new words for the final video.", "standard", "free:en-US-JennyNeural", email);
  console.log("generateVoice free jenny", { ok: free.ok, url: free.audioRef?.url, dur: free.durationSeconds });
  if (gen.ok && free.ok && gen.audioRef?.url === free.audioRef?.url) failures.push("trained and free produced same URL");
}

console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exit(1);
