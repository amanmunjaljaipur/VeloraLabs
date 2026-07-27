"use client";

/**
 * Multi-country free voice picker + trained samples.
 * Voices are real neural ShortNames (msedge-tts) — not labels only.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FREE_VOICE_PRESETS,
  freeVoicesByRegion,
  type FreeVoicePreset,
} from "@/lib/avatar-studio/free-voices";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Pause, Play, User } from "lucide-react";
import { useRef, useState } from "react";

export interface TrainProfileLite {
  id: string;
  name: string;
  kind: "voice" | "avatar" | "both";
  status: string;
  sourceMedia: { provider: string; url: string } | null;
  mediaBank?: { id: string; url: string; kind: string }[];
  coverMediaId?: string | null;
  ttsVoiceHint?: string | null;
  geminiVoice?: string | null;
  trainSummary?: string | null;
}

function coverUrlOf(p: TrainProfileLite): string | null {
  if (p.coverMediaId && p.mediaBank?.length) {
    const hit = p.mediaBank.find((m) => m.id === p.coverMediaId);
    if (hit?.url) return hit.url;
  }
  const img = p.mediaBank?.find((m) => m.kind === "image");
  if (img?.url) return img.url;
  return p.sourceMedia?.url ?? null;
}

function VoiceRow({
  selected,
  primary,
  title,
  subtitle,
  onSelect,
  onSetPrimary,
  onPlay,
  playing,
  loading,
  avatar,
  showPlay = true,
}: {
  selected: boolean;
  primary: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
  onSetPrimary?: () => void;
  onPlay?: () => void;
  playing: boolean;
  loading: boolean;
  avatar?: React.ReactNode;
  showPlay?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        selected || primary
          ? "border-accent-teal bg-accent-teal/10 ring-1 ring-accent-teal/30"
          : "border-border bg-card hover:border-accent-teal/40"
      )}
      whileHover={reduce ? undefined : { y: HOVER.cardLift }}
      transition={{ duration: DURATION.hover, ease: EASE_OUT }}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onSelect}>
        {avatar}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            {primary ? <Badge variant="success">In use</Badge> : null}
          </div>
          <p className="truncate text-xs text-text-secondary">{subtitle}</p>
        </div>
      </button>
      {showPlay ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={loading}
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          aria-label={playing ? "Pause" : "Listen"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Stop" : "Listen"}
        </Button>
      ) : null}
      {onSetPrimary && !primary ? (
        <Button type="button" size="sm" variant="secondary" onClick={onSetPrimary}>
          Use
        </Button>
      ) : null}
    </motion.div>
  );
}

export function FreeVoiceList({
  selectedIds,
  primaryId,
  onToggle,
  onSetPrimary,
}: {
  selectedIds: string[];
  primaryId: string;
  onToggle: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const regions = freeVoicesByRegion();

  async function playFree(v: FreeVoicePreset) {
    if (playingId === v.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    setLoadingId(v.id);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const res = await fetch(`/api/avatar-studio/voices/preview?voiceId=${encodeURIComponent(v.id)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("preview failed", err);
        setLoadingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setPlayingId(v.id);
    } catch {
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium text-text-secondary">
        Free neural voices by country — press <strong>Listen</strong> (they sound different), then{" "}
        <strong>Use</strong> for your video.
      </p>
      {regions.map(({ region, voices }) => (
        <div key={region} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">{region}</p>
          {voices.map((v) => (
            <VoiceRow
              key={v.id}
              title={`${v.label}`}
              subtitle={`${v.tagline} · ${v.edgeVoice}`}
              selected={selectedIds.includes(v.id) || primaryId === v.id}
              primary={primaryId === v.id}
              onSelect={() => {
                onSetPrimary(v.id);
                onToggle(v.id);
              }}
              onSetPrimary={() => onSetPrimary(v.id)}
              onPlay={() => void playFree(v)}
              playing={playingId === v.id}
              loading={loadingId === v.id}
              avatar={
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-navy text-[10px] font-bold leading-tight text-white dark:bg-white dark:text-navy">
                  <span>{v.region.slice(0, 2).toUpperCase()}</span>
                  <span className="text-[9px] font-medium opacity-80">{v.gender === "female" ? "F" : "M"}</span>
                </div>
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TrainedVoiceList({
  profiles,
  selectedIds,
  primaryId,
  onToggle,
  onSetPrimary,
}: {
  profiles: TrainProfileLite[];
  selectedIds: string[];
  primaryId: string;
  onToggle: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function playSample(p: TrainProfileLite) {
    if (playingId === p.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    setLoadingId(p.id);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      let url = p.sourceMedia?.url ?? null;
      if (!url) {
        const res = await fetch(`/api/avatar-studio/voices/preview?profileId=${encodeURIComponent(p.id)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          setLoadingId(null);
          return;
        }
        url = data.url as string;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      await audio.play();
      setPlayingId(p.id);
    } catch {
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-accent-teal/40 bg-accent-teal/5 px-4 py-6 text-center">
        <p className="text-sm font-medium text-foreground">No trained voices yet</p>
        <p className="mt-1 text-sm text-text-secondary">
          Open <strong>Train</strong> → <strong>Train new voice</strong>, record 15–30s, then pick it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-secondary">
        Your samples — free path uses the neural country voice you set at Train (true clone needs Setup → custom URL)
      </p>
      {profiles.map((p) => {
        const trained = Boolean(p.geminiVoice || p.trainSummary);
        return (
          <VoiceRow
            key={p.id}
            title={p.name}
            subtitle={
              trained
                ? `✓ Trained · ${p.trainSummary || p.geminiVoice} · ▶ sample · Use for video`
                : `Sample only — open Train → Train now · ▶ sample`
            }
            selected={selectedIds.includes(p.id) || primaryId === p.id}
            primary={primaryId === p.id}
            onSelect={() => {
              onSetPrimary(p.id);
              onToggle(p.id);
            }}
            onSetPrimary={() => onSetPrimary(p.id)}
            onPlay={() => void playSample(p)}
            playing={playingId === p.id}
            loading={loadingId === p.id}
            avatar={
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-[10px] font-bold",
                  trained ? "bg-accent-teal text-white" : "bg-muted"
                )}
              >
                {trained ? "AI" : <User className="size-4" />}
              </div>
            }
          />
        );
      })}
    </div>
  );
}

export function FacePickerList({
  profiles,
  selectedIds,
  primaryId,
  freeId,
  onToggle,
  onSetPrimary,
}: {
  profiles: TrainProfileLite[];
  selectedIds: string[];
  primaryId: string;
  freeId: string;
  onToggle: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-secondary">Characters / faces</p>
      <VoiceRow
        title="Auto portrait"
        subtitle="Free AI face — or photo from Setup"
        selected={selectedIds.includes(freeId)}
        primary={primaryId === freeId}
        onSelect={() => {
          onToggle(freeId);
          onSetPrimary(freeId);
        }}
        onSetPrimary={() => onSetPrimary(freeId)}
        showPlay={false}
        playing={false}
        loading={false}
        avatar={
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-text-secondary" />
          </div>
        }
      />
      {profiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-text-secondary">
          No faces yet. <strong>Train → Add character</strong>.
        </p>
      ) : (
        profiles.map((p) => {
          const cover = coverUrlOf(p);
          const bankCount = p.mediaBank?.filter((m) => m.kind === "image" || m.kind === "video").length ?? 0;
          return (
            <VoiceRow
              key={p.id}
              title={p.name}
              subtitle={
                bankCount > 1
                  ? `${bankCount} photos · cover used on free video`
                  : "Cover photo on free animated video"
              }
              selected={selectedIds.includes(p.id)}
              primary={primaryId === p.id}
              onSelect={() => {
                onToggle(p.id);
                onSetPrimary(p.id);
              }}
              onSetPrimary={() => onSetPrimary(p.id)}
              onPlay={() => {
                if (cover) window.open(cover, "_blank");
              }}
              playing={false}
              loading={false}
              avatar={
                cover && (/\.(jpg|jpeg|png|webp|gif)/i.test(cover) || cover.includes("/media/")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <User className="size-4" />
                  </div>
                )
              }
            />
          );
        })
      )}
    </div>
  );
}
