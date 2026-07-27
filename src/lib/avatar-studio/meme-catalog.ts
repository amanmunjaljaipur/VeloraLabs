/**
 * Free / royalty-free reaction & b-roll meme library for Avatar Studio.
 *
 * Sources are royalty-free stock (Pixabay CDN samples + Coverr-style free
 * clips). No copyrighted meme templates (Pepe, etc.) — only free-to-use stock
 * that feels like “meme b-roll” (reactions, applause, wow, fail, success).
 *
 * On-the-fly resolution can also pull Pexels Videos API when PEXELS_API_KEY
 * is set (free key at https://www.pexels.com/api/).
 */

export type VideoGenre =
  | "educational"
  | "funny"
  | "motivational"
  | "tech"
  | "storytelling"
  | "product"
  | "general";

export type MemeMood =
  | "hook"
  | "wow"
  | "laugh"
  | "agree"
  | "fail"
  | "success"
  | "think"
  | "transition"
  | "celebrate";

export interface FreeMemeClip {
  id: string;
  title: string;
  mood: MemeMood;
  genres: VideoGenre[];
  /** Short human label shown in UI */
  tagline: string;
  /** Search queries for Pexels / Pixabay on-the-fly */
  searchQueries: string[];
  /**
   * Stable free fallback MP4 URL (royalty-free stock).
   * Used when Pexels is not configured or fetch fails.
   */
  fallbackUrl: string;
  /** Suggested length when inserted (seconds) */
  durationSeconds: number;
  license: "pixabay" | "pexels" | "coverr" | "public";
}

/**
 * Curated free stock clips — all URLs point to royalty-free CDNs.
 * (Pixabay Content License: free for commercial use, no attribution required.)
 */
export const FREE_MEME_CLIPS: FreeMemeClip[] = [
  {
    id: "applause",
    title: "Crowd applause",
    mood: "celebrate",
    genres: ["motivational", "educational", "product", "general"],
    tagline: "Celebration / big win",
    searchQueries: ["applause crowd", "clapping hands audience"],
    fallbackUrl: "https://cdn.pixabay.com/video/2016/11/16/6362-191687758_tiny.mp4",
    durationSeconds: 2.5,
    license: "pixabay",
  },
  {
    id: "lightbulb",
    title: "Idea spark",
    mood: "wow",
    genres: ["educational", "tech", "storytelling", "general"],
    tagline: "Aha moment",
    searchQueries: ["light bulb idea", "inspiration spark"],
    fallbackUrl: "https://cdn.pixabay.com/video/2020/05/25/40130-424930508_tiny.mp4",
    durationSeconds: 2.2,
    license: "pixabay",
  },
  {
    id: "typing",
    title: "Keyboard hustle",
    mood: "think",
    genres: ["tech", "educational", "product"],
    tagline: "Deep work / coding",
    searchQueries: ["typing keyboard close up", "coding laptop"],
    fallbackUrl: "https://cdn.pixabay.com/video/2019/05/22/23925-339221851_tiny.mp4",
    durationSeconds: 2.5,
    license: "pixabay",
  },
  {
    id: "laugh",
    title: "Happy laugh",
    mood: "laugh",
    genres: ["funny", "storytelling", "general"],
    tagline: "Funny beat",
    searchQueries: ["people laughing", "funny friends smiling"],
    fallbackUrl: "https://cdn.pixabay.com/video/2017/05/17/9359-217528871_tiny.mp4",
    durationSeconds: 2.4,
    license: "pixabay",
  },
  {
    id: "facepalm",
    title: "Oh no",
    mood: "fail",
    genres: ["funny", "tech", "educational"],
    tagline: "Mistake / fail",
    searchQueries: ["frustrated person", "disappointed reaction"],
    fallbackUrl: "https://cdn.pixabay.com/video/2021/04/13/71099-536698386_tiny.mp4",
    durationSeconds: 2.2,
    license: "pixabay",
  },
  {
    id: "nod",
    title: "Yes nod",
    mood: "agree",
    genres: ["educational", "motivational", "product", "general"],
    tagline: "Agreement",
    searchQueries: ["person nodding yes", "thumbs up"],
    fallbackUrl: "https://cdn.pixabay.com/video/2019/03/18/22058-325367693_tiny.mp4",
    durationSeconds: 2.0,
    license: "pixabay",
  },
  {
    id: "rocket",
    title: "Launch energy",
    mood: "success",
    genres: ["motivational", "tech", "product"],
    tagline: "Growth / launch",
    searchQueries: ["rocket launch", "success celebration"],
    fallbackUrl: "https://cdn.pixabay.com/video/2019/07/12/25114-348506213_tiny.mp4",
    durationSeconds: 2.5,
    license: "pixabay",
  },
  {
    id: "mindblown",
    title: "Mind blown",
    mood: "wow",
    genres: ["educational", "funny", "tech", "storytelling"],
    tagline: "Surprise fact",
    searchQueries: ["surprised reaction", "amazed face"],
    fallbackUrl: "https://cdn.pixabay.com/video/2020/08/05/45961-447087730_tiny.mp4",
    durationSeconds: 2.3,
    license: "pixabay",
  },
  {
    id: "city",
    title: "City hustle",
    mood: "transition",
    genres: ["storytelling", "product", "general", "motivational"],
    tagline: "Scene change",
    searchQueries: ["city timelapse", "busy street"],
    fallbackUrl: "https://cdn.pixabay.com/video/2019/03/21/22199-325929824_tiny.mp4",
    durationSeconds: 2.5,
    license: "pixabay",
  },
  {
    id: "nature",
    title: "Calm nature",
    mood: "transition",
    genres: ["educational", "storytelling", "motivational", "general"],
    tagline: "Breathe / reset",
    searchQueries: ["forest sunlight", "calm nature"],
    fallbackUrl: "https://cdn.pixabay.com/video/2020/04/07/35163-409743533_tiny.mp4",
    durationSeconds: 2.5,
    license: "pixabay",
  },
  {
    id: "coffee",
    title: "Coffee pause",
    mood: "hook",
    genres: ["funny", "storytelling", "general", "product"],
    tagline: "Relatable start",
    searchQueries: ["coffee morning", "pouring coffee"],
    fallbackUrl: "https://cdn.pixabay.com/video/2016/09/21/5206-183786655_tiny.mp4",
    durationSeconds: 2.2,
    license: "pixabay",
  },
  {
    id: "highfive",
    title: "High five",
    mood: "success",
    genres: ["motivational", "funny", "product", "educational"],
    tagline: "Team win",
    searchQueries: ["high five", "team celebration"],
    fallbackUrl: "https://cdn.pixabay.com/video/2017/11/03/12799-241680534_tiny.mp4",
    durationSeconds: 2.0,
    license: "pixabay",
  },
];

export function clipsForGenre(genre: VideoGenre): FreeMemeClip[] {
  return FREE_MEME_CLIPS.filter((c) => c.genres.includes(genre) || c.genres.includes("general"));
}

export function getClipById(id: string): FreeMemeClip | undefined {
  return FREE_MEME_CLIPS.find((c) => c.id === id);
}
