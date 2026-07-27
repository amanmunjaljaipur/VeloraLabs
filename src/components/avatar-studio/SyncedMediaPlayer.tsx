"use client";

/**
 * Custom player with a seek bar driven by media currentTime / duration
 * so progress always matches what has already played (video or still+audio).
 */

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SyncedMediaPlayer({
  videoUrl,
  audioUrl,
  posterUrl,
  caption,
  mode,
}: {
  videoUrl?: string | null;
  audioUrl?: string | null;
  posterUrl?: string | null;
  caption?: string | null;
  /** "video" uses <video>; "audio" uses poster + <audio> with shared seek bar */
  mode: "video" | "audio";
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const scrubbing = useRef(false);

  const mediaEl = useCallback(() => {
    return mode === "video" ? videoRef.current : audioRef.current;
  }, [mode]);

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    setReady(false);
  }, [videoUrl, audioUrl, mode]);

  useEffect(() => {
    const el = mediaEl();
    if (!el) return;

    const onTime = () => {
      if (scrubbing.current) return;
      setCurrent(el.currentTime);
    };
    const onMeta = () => {
      const d = el.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        setReady(true);
      }
    };
    const onDur = () => {
      const d = el.duration;
      if (Number.isFinite(d) && d > 0) setDuration(d);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(el.duration || 0);
    };
    // Some browsers report Infinity for stream-like files until enough is buffered
    const onProgress = () => {
      if ((!Number.isFinite(el.duration) || el.duration === Infinity) && el.buffered.length > 0) {
        const end = el.buffered.end(el.buffered.length - 1);
        if (end > 0 && (!Number.isFinite(duration) || duration === 0 || end > duration)) {
          // keep using duration when known; else show buffered as soft max
        }
      }
      if (Number.isFinite(el.duration) && el.duration > 0 && el.duration !== Infinity) {
        setDuration(el.duration);
        setReady(true);
      }
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("progress", onProgress);
    el.addEventListener("canplay", onMeta);

    // If already loaded
    if (el.readyState >= 1) onMeta();

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("canplay", onMeta);
    };
  }, [mediaEl, videoUrl, audioUrl, duration]);

  const pct = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

  async function togglePlay() {
    const el = mediaEl();
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch {
      /* autoplay policies */
    }
  }

  function seekToRatio(ratio: number) {
    const el = mediaEl();
    if (!el || !Number.isFinite(duration) || duration <= 0) return;
    const t = Math.max(0, Math.min(duration, ratio * duration));
    el.currentTime = t;
    setCurrent(t);
  }

  function onSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    scrubbing.current = true;
    seekToRatio(v / 100);
  }

  function onSliderCommit() {
    scrubbing.current = false;
  }

  function toggleMute() {
    const el = mediaEl();
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-navy">
      {mode === "video" && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl ?? undefined}
          className="mx-auto max-h-[480px] w-full object-contain"
          playsInline
          preload="metadata"
          // Hide native controls — we drive our own synced bar
          controls={false}
          onClick={() => void togglePlay()}
        />
      ) : (
        <div className="relative">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt="Presenter"
              className={cn(
                "mx-auto max-h-[420px] w-full object-contain transition-transform duration-500",
                playing && "scale-[1.02]"
              )}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-white/70">No poster</div>
          )}
          {audioUrl ? (
            <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
          ) : null}
        </div>
      )}

      {/* Custom controls + seek bar synced to playback */}
      <div className="flex flex-col gap-2 bg-card p-3">
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={() => void togglePlay()} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <span className="min-w-[5.5rem] tabular-nums text-xs text-text-secondary">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          {!ready && duration === 0 ? (
            <span className="text-xs text-text-secondary">Loading media…</span>
          ) : null}
        </div>

        <label className="flex w-full flex-col gap-1">
          <span className="sr-only">Playback progress</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={Number.isFinite(pct) ? pct : 0}
            onChange={onSliderChange}
            onMouseUp={onSliderCommit}
            onTouchEnd={onSliderCommit}
            onKeyUp={onSliderCommit}
            className="h-2 w-full cursor-pointer accent-[var(--accent-teal)]"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
          />
          {/* Visual fill track for browsers that don't style range fill well */}
          <div className="relative -mt-1 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-accent-teal transition-[width] duration-75 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </label>

        {caption ? <p className="text-xs text-text-secondary">{caption}</p> : null}
      </div>
    </div>
  );
}
