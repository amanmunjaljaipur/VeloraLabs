/**
 * Public freemium limits for Avatar Studio. Shown to every user in the UI.
 * Free path never requires a GPU host — Edge TTS + presenter (still + audio + captions).
 * Paid / custom endpoints are opt-in via Setup (per-user URL) or env vars.
 */

export const FREE_TIER_MONTHLY_TOKENS = 200;

/** Free presenter / free voice clip size used for long-form planning. */
export const FREE_MAX_CLIP_SECONDS = 60;

/** Long-form hard cap (product limit, not model limit). */
export const MAX_LONG_FORM_MINUTES = 30;

export type ProviderTier = "free" | "custom" | "unavailable";

export interface FreemiumPlanPublic {
  monthlyTokens: number;
  freeVoice: {
    id: string;
    label: string;
    description: string;
    dailySoftLimitNote: string;
  };
  freeAvatar: {
    id: string;
    label: string;
    description: string;
    maxClipSeconds: number;
  };
  customEndpoints: {
    voice: string;
    avatar: string;
    frameExtract: string;
    stitch: string;
  };
  paidNotes: string[];
  longFormMinutesMax: number;
}

export function getPublicFreemiumPlan(): FreemiumPlanPublic {
  return {
    monthlyTokens: FREE_TIER_MONTHLY_TOKENS,
    freeVoice: {
      id: "piper",
      label: "Free neural voice (Edge TTS)",
      description:
        "High-quality multi-language speech with no API key and no GPU. Works out of the box. For premium clone quality, paste your own TTS endpoint in Setup.",
      dailySoftLimitNote: "Fair-use rate limits apply on the free voice path to keep the service available for everyone.",
    },
    freeAvatar: {
      id: "musetalk",
      label: "Free Presenter mode",
      description:
        "Still portrait + narrated audio + captions (playable in-app). No GPU required. For true lip-sync, connect a paid or self-hosted avatar URL in Setup.",
      maxClipSeconds: FREE_MAX_CLIP_SECONDS,
    },
    customEndpoints: {
      voice: "POST {url} body: { text, voiceProfileId?, qualityTier } → { audioUrl }",
      avatar: "POST {url} body: { audioUrl, avatarProfileId?, qualityTier, referenceImageUrl? } → { videoUrl, durationSeconds }",
      frameExtract: "POST {url} body: { videoUrl } → { imageUrl }",
      stitch: "POST {url} body: { videoUrls[] } → { videoUrl, durationSeconds }",
    },
    paidNotes: [
      "Lip-sync hosts (fal.ai, D-ID, Replicate, your own MuseTalk/Wav2Lip) are optional paid/self-hosted paths.",
      "Paste endpoint URLs in Setup → Generation. Your keys never leave your account record on this server.",
      "Free path is always available as fallback when a custom endpoint fails.",
    ],
    longFormMinutesMax: MAX_LONG_FORM_MINUTES,
  };
}
