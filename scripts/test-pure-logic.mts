import { suggestMemesForScript } from "../src/lib/avatar-studio/meme-suggest.ts";
import { FREE_VOICE_PRESETS, freeVoiceEdgeName, isFreeVoiceId } from "../src/lib/avatar-studio/free-voices.ts";
import { getCoverUrl, normalizeProfile } from "../src/lib/avatar-studio/profiles-store.ts";

const failures: string[] = [];

// Meme suggest educational
const edu = suggestMemesForScript(
  "Today we will learn how to explain async await. Step one: definition. Step two: example. Step three: common mistakes. In this video you will understand the concept."
);
if (edu.genre !== "educational" && edu.genre !== "tech") {
  failures.push("expected educational/tech genre got " + edu.genre);
}
if (edu.placements.length < 1) failures.push("no meme placements for educational script");

// Meme suggest funny
const funny = suggestMemesForScript(
  "This joke is hilarious. LOL you will laugh so hard. Awkward fail then comedy roast."
);
if (funny.genre !== "funny") failures.push("expected funny got " + funny.genre);

// Profile normalize legacy
const legacy = normalizeProfile({
  id: "p1",
  email: "a@b.com",
  name: "Test",
  kind: "voice",
  status: "ready",
  sourceMedia: { provider: "blob", url: "http://localhost/x.mp3" },
  error: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);
if (!legacy.mediaBank?.length) failures.push("normalize should seed mediaBank");
if (!legacy.coverMediaId) failures.push("normalize should set cover");

// free voice ids
for (const v of FREE_VOICE_PRESETS) {
  if (!isFreeVoiceId(v.id)) failures.push("not free " + v.id);
  if (freeVoiceEdgeName(v.id) !== v.edgeVoice) failures.push("edge map " + v.id);
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  failures,
  eduGenre: edu.genre,
  eduPlacements: edu.placements.length,
  funnyGenre: funny.genre,
  funnyPlacements: funny.placements.length,
  legacyBank: legacy.mediaBank.length,
  voiceCount: FREE_VOICE_PRESETS.length,
}, null, 2));
if (failures.length) process.exit(1);
