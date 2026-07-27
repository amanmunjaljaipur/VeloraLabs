"use client";

/**
 * Free video memes: detect script genre, show where memes fit, let user pick.
 * Only royalty-free stock — no copyrighted internet memes.
 */

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Film, Loader2, Sparkles, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface SelectedMemeForJob {
  placementId: string;
  clipId: string;
  positionRatio: number;
  scriptSnippet: string;
  label: string;
  mood: string;
  sourceUrl?: string;
}

interface ClipOption {
  id: string;
  title: string;
  tagline: string;
  mood: string;
  durationSeconds: number;
  license: string;
}

interface Placement {
  id: string;
  positionRatio: number;
  scriptSnippet: string;
  reason: string;
  mood: string;
  label: string;
  defaultClipId: string;
  clipOptions: ClipOption[];
  resolvedUrl?: string;
}

interface SuggestPayload {
  genre: string;
  genreLabel: string;
  genreConfidence: string;
  genreReasons: string[];
  placements: Placement[];
  licenseNote: string;
  pexelsConfigured?: boolean;
}

export function MemeSuggestPanel({
  script,
  enabled,
  onEnabledChange,
  selected,
  onSelectedChange,
  videoGenre,
  onVideoGenreChange,
}: {
  script: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  selected: SelectedMemeForJob[];
  onSelectedChange: (s: SelectedMemeForJob[]) => void;
  videoGenre: string | null;
  onVideoGenreChange: (g: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuggestPayload | null>(null);
  /** placementId → chosen clipId */
  const [choices, setChoices] = useState<Record<string, string>>({});
  /** placementId → included */
  const [included, setIncluded] = useState<Record<string, boolean>>({});

  const runSuggest = useCallback(async () => {
    if (!script.trim() || script.trim().length < 12) {
      setError("Add a script first so we can pick genre and meme spots.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/avatar-studio/memes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, maxPlacements: 4, resolveUrls: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not suggest memes");
        return;
      }
      setData(json as SuggestPayload);
      onVideoGenreChange(json.genre ?? null);
      const nextChoices: Record<string, string> = {};
      const nextIncluded: Record<string, boolean> = {};
      for (const p of json.placements as Placement[]) {
        nextChoices[p.id] = p.defaultClipId;
        nextIncluded[p.id] = true;
      }
      setChoices(nextChoices);
      setIncluded(nextIncluded);
      // Push selection upward
      const sel: SelectedMemeForJob[] = (json.placements as Placement[])
        .filter((p) => nextIncluded[p.id])
        .map((p) => ({
          placementId: p.id,
          clipId: nextChoices[p.id] || p.defaultClipId,
          positionRatio: p.positionRatio,
          scriptSnippet: p.scriptSnippet,
          label: p.label,
          mood: p.mood,
          sourceUrl: p.resolvedUrl,
        }));
      onSelectedChange(sel);
    } catch {
      setError("Could not analyze script for memes");
    } finally {
      setLoading(false);
    }
  }, [script, onSelectedChange, onVideoGenreChange]);

  useEffect(() => {
    if (!enabled) {
      onSelectedChange([]);
      onVideoGenreChange(null);
      return;
    }
    if (script.trim().length >= 12) {
      void runSuggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  function syncSelection(
    nextIncluded: Record<string, boolean>,
    nextChoices: Record<string, string>,
    payload: SuggestPayload | null
  ) {
    if (!payload) {
      onSelectedChange([]);
      return;
    }
    const sel: SelectedMemeForJob[] = payload.placements
      .filter((p) => nextIncluded[p.id])
      .map((p) => ({
        placementId: p.id,
        clipId: nextChoices[p.id] || p.defaultClipId,
        positionRatio: p.positionRatio,
        scriptSnippet: p.scriptSnippet,
        label: p.label,
        mood: p.mood,
        sourceUrl: p.resolvedUrl,
      }));
    onSelectedChange(sel);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
            <Film className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Free video memes</p>
            <p className="text-xs text-text-secondary">
              Royalty-free b-roll · placed from your script tone
            </p>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-[var(--accent-teal,#14b8a6)]"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Add free memes
        </label>
      </div>

      {enabled ? (
        <div className="flex flex-col gap-4 p-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="size-4 animate-spin" /> Reading script tone &amp; meme spots…
            </p>
          ) : null}

          {error ? (
            <Alert variant="warning" title="Memes">
              {error}
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => void runSuggest()}>
                Retry
              </Button>
            </Alert>
          ) : null}

          {data && !loading ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{data.genreLabel}</Badge>
                <Badge variant="outline">Confidence: {data.genreConfidence}</Badge>
                {videoGenre ? <Badge variant="secondary">Genre: {videoGenre}</Badge> : null}
                {data.pexelsConfigured ? (
                  <Badge variant="outline">Live free library</Badge>
                ) : (
                  <Badge variant="outline">Curated free stock</Badge>
                )}
              </div>
              {data.genreReasons[0] ? (
                <p className="text-xs text-text-secondary">{data.genreReasons[0]}</p>
              ) : null}

              {/* Timeline of where memes fit */}
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                {data.placements.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.label}
                    className={cn(
                      "absolute top-0 h-full w-2.5 -translate-x-1/2 rounded-full",
                      included[p.id] ? "bg-accent-teal" : "bg-border"
                    )}
                    style={{ left: `${p.positionRatio * 100}%` }}
                    onClick={() => {
                      const next = { ...included, [p.id]: !included[p.id] };
                      setIncluded(next);
                      syncSelection(next, choices, data);
                    }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-text-secondary">
                Timeline: teal marks = free meme inserts (toggle on each card)
              </p>

              <div className="flex flex-col gap-3">
                {data.placements.map((p, idx) => {
                  const on = included[p.id] !== false;
                  const clipId = choices[p.id] || p.defaultClipId;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-xl border p-3",
                        on ? "border-accent-teal/40 bg-accent-teal/5" : "border-border opacity-70"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              ~{Math.round(p.positionRatio * 100)}% in
                            </Badge>
                            <span className="text-sm font-semibold text-foreground">
                              {idx + 1}. {p.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs italic text-text-secondary">
                            “…{p.scriptSnippet}…”
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">{p.reason}</p>
                        </div>
                        <label className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => {
                              const next = { ...included, [p.id]: e.target.checked };
                              setIncluded(next);
                              syncSelection(next, choices, data);
                            }}
                          />
                          Use
                        </label>
                      </div>

                      {on ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {p.clipOptions.map((c) => {
                            const active = clipId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  const next = { ...choices, [p.id]: c.id };
                                  setChoices(next);
                                  syncSelection(included, next, data);
                                }}
                                className={cn(
                                  "flex items-start gap-2 rounded-lg border p-2 text-left text-xs",
                                  active
                                    ? "border-accent-teal bg-card ring-1 ring-accent-teal/40"
                                    : "border-border hover:border-accent-teal/30"
                                )}
                              >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-navy text-white">
                                  <Video className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground">{c.title}</p>
                                  <p className="text-text-secondary">{c.tagline}</p>
                                  <p className="mt-0.5 text-[10px] text-text-secondary">
                                    ~{c.durationSeconds}s · free {c.license}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-text-secondary">{data.licenseNote}</p>
              <Button size="sm" variant="secondary" onClick={() => void runSuggest()} disabled={loading}>
                <Sparkles className="size-3.5" /> Refresh suggestions
              </Button>
            </>
          ) : null}

          {enabled && !loading && !data && !error ? (
            <Button size="sm" onClick={() => void runSuggest()}>
              Analyze script for free memes
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-text-secondary">
          Optional. When on, we detect educational / funny / tech tone and insert free stock
          reaction clips at natural script beats.
        </p>
      )}
    </div>
  );
}
