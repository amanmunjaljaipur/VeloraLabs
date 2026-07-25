import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Video category config - drives auto-script generation tone/structure and
 * Moderation Agent thresholds (Section 5 of the spec). Blob-backed rather
 * than a hardcoded constant, since the spec calls this "config-driven, not
 * hardcoded - expected to evolve quarterly": an admin can add/retire
 * categories without a redeploy. Seeded with the spec's starting set on
 * first read.
 */

const CATEGORIES_FILE = "avatar-categories.json";
const DEFAULT_JSON = "[]";

export interface VideoCategory {
  id: string;
  label: string;
  /** Guidance folded into the script-generation prompt - tone, pacing, structure. */
  promptGuidance: string;
  /** "standard" | "elevated" - elevated categories (impersonation-prone, e.g. Reaction/Commentary) get tighter Moderation Agent thresholds. */
  moderationLevel: "standard" | "elevated";
  isDefault?: boolean;
}

const SEED_CATEGORIES: VideoCategory[] = [
  { id: "corporate-training", label: "Corporate/Training", promptGuidance: "Clear, structured, professional. Short sentences, one idea per beat, explicit takeaways.", moderationLevel: "standard", isDefault: true },
  { id: "educational-howto", label: "Educational/How-To", promptGuidance: "Step-by-step, plain language, define jargon on first use, end with a recap.", moderationLevel: "standard" },
  { id: "comedy-funny", label: "Comedy/Funny", promptGuidance: "Punchy, upbeat, timing-aware setups and payoffs, conversational.", moderationLevel: "standard" },
  { id: "serious-documentary", label: "Serious/Documentary", promptGuidance: "Measured pace, evidence-led, neutral tone, avoid sensationalism.", moderationLevel: "standard" },
  { id: "series-episodic", label: "Series/Episodic", promptGuidance: "Recap hook at open, cliffhanger or teaser at close, consistent voice across episodes.", moderationLevel: "standard" },
  { id: "asmr", label: "ASMR", promptGuidance: "Slow, soft, minimal narration, sensory and descriptive language.", moderationLevel: "standard" },
  { id: "entertainment-skit", label: "Entertainment/Skit", promptGuidance: "Scene-setting, character voice, short punchy exchanges.", moderationLevel: "standard" },
  { id: "trend-reaction", label: "Trend/Reaction", promptGuidance: "Casual, opinionated, timely references - flag anything referencing a real named person for review.", moderationLevel: "elevated" },
  { id: "vlog-bts", label: "Behind-the-Scenes/Vlog-style", promptGuidance: "First-person, informal, present-tense narration.", moderationLevel: "standard" },
  { id: "product-demo", label: "Product Demo/Review", promptGuidance: "Feature-benefit structure, honest tone, clear call to action.", moderationLevel: "standard" },
  { id: "motivational-advice", label: "Motivational/Advice", promptGuidance: "Warm, direct, second-person address, concrete actionable steps.", moderationLevel: "standard" },
  { id: "news-commentary", label: "News/Commentary", promptGuidance: "Attribute claims, avoid stating opinion as fact, neutral framing of real events - flag anything about a real named person or organization for review.", moderationLevel: "elevated" },
];

async function readAll(): Promise<VideoCategory[]> {
  await ensureDataFileHydrated(CATEGORIES_FILE, DEFAULT_JSON, { force: true });
  const existing = readJsonFile<VideoCategory[]>(CATEGORIES_FILE, DEFAULT_JSON);
  if (existing.length > 0) return existing;
  await writeJsonFileAsync(CATEGORIES_FILE, SEED_CATEGORIES, DEFAULT_JSON);
  return SEED_CATEGORIES;
}

export async function listCategories(): Promise<VideoCategory[]> {
  return readAll();
}

export async function getCategory(id: string): Promise<VideoCategory | null> {
  const all = await readAll();
  return all.find((c) => c.id === id) ?? null;
}

export async function upsertCategory(category: VideoCategory): Promise<VideoCategory[]> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === category.id);
  if (idx >= 0) all[idx] = category;
  else all.push(category);
  await writeJsonFileAsync(CATEGORIES_FILE, all, DEFAULT_JSON);
  return all;
}

export async function removeCategory(id: string): Promise<VideoCategory[]> {
  const all = await readAll();
  const next = all.filter((c) => c.id !== id);
  await writeJsonFileAsync(CATEGORIES_FILE, next, DEFAULT_JSON);
  return next;
}
