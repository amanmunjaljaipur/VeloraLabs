/**
 * Free multi-country neural voices (Microsoft Edge Read Aloud via msedge-tts).
 * Each id maps to a real ShortName — voices actually sound different (US/UK/IN/AU/IE/CA…).
 */

export interface FreeVoicePreset {
  id: string;
  label: string;
  tagline: string;
  /** Region shown in UI */
  region: string;
  gender: "female" | "male";
  /** Microsoft Edge neural ShortName */
  edgeVoice: string;
  /** Short line spoken in previews (locale-aware feel) */
  sampleLine: string;
}

export const FREE_VOICE_PRESETS: FreeVoicePreset[] = [
  // —— United States ——
  {
    id: "free:en-US-JennyNeural",
    label: "Jenny",
    region: "United States",
    gender: "female",
    tagline: "Warm US English · female",
    edgeVoice: "en-US-JennyNeural",
    sampleLine: "Hi, I'm Jenny from the United States. This is how your American English voice can sound.",
  },
  {
    id: "free:en-US-GuyNeural",
    label: "Guy",
    region: "United States",
    gender: "male",
    tagline: "Clear US English · male",
    edgeVoice: "en-US-GuyNeural",
    sampleLine: "Hi, I'm Guy. Clear American English for confident product and course narration.",
  },
  {
    id: "free:en-US-AriaNeural",
    label: "Aria",
    region: "United States",
    gender: "female",
    tagline: "Bright US English · female",
    edgeVoice: "en-US-AriaNeural",
    sampleLine: "Hello, I'm Aria. A bright American voice for friendly explainers.",
  },
  {
    id: "free:en-US-ChristopherNeural",
    label: "Christopher",
    region: "United States",
    gender: "male",
    tagline: "Deep US English · male",
    edgeVoice: "en-US-ChristopherNeural",
    sampleLine: "I'm Christopher. A deeper American English tone for serious topics.",
  },
  // —— United Kingdom ——
  {
    id: "free:en-GB-SoniaNeural",
    label: "Sonia",
    region: "United Kingdom",
    gender: "female",
    tagline: "Polished British · female",
    edgeVoice: "en-GB-SoniaNeural",
    sampleLine: "Hello, I'm Sonia from the United Kingdom. Calm British English for professional content.",
  },
  {
    id: "free:en-GB-RyanNeural",
    label: "Ryan",
    region: "United Kingdom",
    gender: "male",
    tagline: "Steady British · male",
    edgeVoice: "en-GB-RyanNeural",
    sampleLine: "Hello, I'm Ryan. Clear British narration for lessons and demos.",
  },
  {
    id: "free:en-GB-LibbyNeural",
    label: "Libby",
    region: "United Kingdom",
    gender: "female",
    tagline: "Modern British · female",
    edgeVoice: "en-GB-LibbyNeural",
    sampleLine: "Hi, I'm Libby. A modern UK English voice for tutorials.",
  },
  // —— India ——
  {
    id: "free:en-IN-NeerjaNeural",
    label: "Neerja",
    region: "India",
    gender: "female",
    tagline: "Natural Indian English · female",
    edgeVoice: "en-IN-NeerjaNeural",
    sampleLine: "Hi, I'm Neerja. Natural Indian English for local audiences and education.",
  },
  {
    id: "free:en-IN-PrabhatNeural",
    label: "Prabhat",
    region: "India",
    gender: "male",
    tagline: "Clear Indian English · male",
    edgeVoice: "en-IN-PrabhatNeural",
    sampleLine: "Hello, I'm Prabhat. Clear Indian English for courses and product demos.",
  },
  // —— Australia ——
  {
    id: "free:en-AU-NatashaNeural",
    label: "Natasha",
    region: "Australia",
    gender: "female",
    tagline: "Friendly Australian · female",
    edgeVoice: "en-AU-NatashaNeural",
    sampleLine: "G'day, I'm Natasha from Australia. Friendly Aussie English for your video.",
  },
  {
    id: "free:en-AU-WilliamNeural",
    label: "William",
    region: "Australia",
    gender: "male",
    tagline: "Aussie English · male",
    edgeVoice: "en-AU-WilliamNeural",
    sampleLine: "Hi, I'm William. Australian English narration for clear storytelling.",
  },
  // —— Ireland ——
  {
    id: "free:en-IE-EmilyNeural",
    label: "Emily",
    region: "Ireland",
    gender: "female",
    tagline: "Irish English · female",
    edgeVoice: "en-IE-EmilyNeural",
    sampleLine: "Hello, I'm Emily from Ireland. Soft Irish English for warm presentations.",
  },
  {
    id: "free:en-IE-ConnorNeural",
    label: "Connor",
    region: "Ireland",
    gender: "male",
    tagline: "Irish English · male",
    edgeVoice: "en-IE-ConnorNeural",
    sampleLine: "Hi, I'm Connor. Irish English for engaging course and product videos.",
  },
  // —— Canada ——
  {
    id: "free:en-CA-ClaraNeural",
    label: "Clara",
    region: "Canada",
    gender: "female",
    tagline: "Canadian English · female",
    edgeVoice: "en-CA-ClaraNeural",
    sampleLine: "Hi, I'm Clara from Canada. Clear Canadian English for tutorials.",
  },
  {
    id: "free:en-CA-LiamNeural",
    label: "Liam",
    region: "Canada",
    gender: "male",
    tagline: "Canadian English · male",
    edgeVoice: "en-CA-LiamNeural",
    sampleLine: "Hello, I'm Liam. Canadian English for professional narration.",
  },
  // —— South Africa ——
  {
    id: "free:en-ZA-LeahNeural",
    label: "Leah",
    region: "South Africa",
    gender: "female",
    tagline: "South African English · female",
    edgeVoice: "en-ZA-LeahNeural",
    sampleLine: "Hi, I'm Leah from South Africa. Distinct South African English for your content.",
  },
  {
    id: "free:en-ZA-LukeNeural",
    label: "Luke",
    region: "South Africa",
    gender: "male",
    tagline: "South African English · male",
    edgeVoice: "en-ZA-LukeNeural",
    sampleLine: "Hello, I'm Luke. South African English for clear video narration.",
  },
];

export const DEFAULT_FREE_VOICE_ID = FREE_VOICE_PRESETS[0]!.id;

export function isFreeVoiceId(id: string | null | undefined): boolean {
  return Boolean(id && id.startsWith("free:"));
}

export function getFreeVoicePreset(id: string | null | undefined): FreeVoicePreset | null {
  if (!id) return FREE_VOICE_PRESETS[0] ?? null;
  return FREE_VOICE_PRESETS.find((v) => v.id === id) ?? null;
}

/** Resolve Edge ShortName from free:id or raw ShortName. */
export function freeVoiceEdgeName(id: string | null | undefined): string {
  if (!id) return "en-US-JennyNeural";
  if (id.startsWith("free:")) {
    return getFreeVoicePreset(id)?.edgeVoice ?? "en-US-JennyNeural";
  }
  // Already a ShortName like en-GB-RyanNeural
  if (/^[a-z]{2}-[A-Z]{2}-/.test(id)) return id;
  return getFreeVoicePreset(id)?.edgeVoice ?? "en-US-JennyNeural";
}

export function freeVoicesByRegion(): { region: string; voices: FreeVoicePreset[] }[] {
  const map = new Map<string, FreeVoicePreset[]>();
  for (const v of FREE_VOICE_PRESETS) {
    const list = map.get(v.region) ?? [];
    list.push(v);
    map.set(v.region, list);
  }
  return Array.from(map.entries()).map(([region, voices]) => ({ region, voices }));
}
