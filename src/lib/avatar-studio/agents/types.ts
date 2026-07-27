/**
 * Shared types for the Avatar Studio agent pipeline. Each agent is a single-
 * purpose module (own file, own exported function(s)) per the spec's "each
 * agent has one job, independently versioned" requirement. Tracked in
 * src/lib/avatar-studio/agents/README.md alongside this file.
 */

export interface ModerationResult {
  approved: boolean;
  reason: string | null;
  flaggedTerms: string[];
}

export type OutputKind = "video" | "presenter";

export interface GenerationResult {
  ok: boolean;
  storageRef: { provider: "blob" | "google_drive"; url: string; driveFileId?: string } | null;
  durationSeconds: number | null;
  error: string | null;
  /** True video vs free presenter (audio + poster + captions). */
  outputKind?: OutputKind;
  audioRef?: { provider: "blob" | "google_drive"; url: string; driveFileId?: string } | null;
  posterRef?: { provider: "blob" | "google_drive"; url: string; driveFileId?: string } | null;
}

export interface QaResult {
  score: number;
  passed: boolean;
  notes: string;
}
