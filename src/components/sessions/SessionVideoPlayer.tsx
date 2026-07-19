"use client";

import { VideoProgressBar } from "@/components/ui/VideoProgressBar";
import { loadYouTubeIframeApi, YT_PLAYER_STATE, type YouTubePlayer } from "@/lib/youtube-player";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface SessionVideoPlayerProps {
  sessionId: string;
  videoId: string;
  title: string;
  initialWatchedSeconds?: number;
  initialDurationSeconds?: number;
  initialPercent?: number;
  reviewMode?: boolean;
}

const SAVE_INTERVAL_MS = 5000;
const RESUME_BUFFER_SECONDS = 5;

function formatWatchTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getResumeSeconds(
  watchedSeconds: number,
  durationSeconds: number,
  percent: number
): number {
  if (percent >= 99 || watchedSeconds <= 0) return 0;
  if (durationSeconds > 0) {
    return Math.max(0, Math.min(watchedSeconds - RESUME_BUFFER_SECONDS, durationSeconds - 10));
  }
  return Math.max(0, watchedSeconds - RESUME_BUFFER_SECONDS);
}

export function SessionVideoPlayer({
  sessionId,
  videoId,
  title,
  initialWatchedSeconds = 0,
  initialDurationSeconds = 0,
  initialPercent = 0,
  reviewMode = false,
}: SessionVideoPlayerProps) {
  const rawId = useId();
  const playerElementId = `yt-player-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestProgressRef = useRef({
    watched: initialWatchedSeconds,
    duration: initialDurationSeconds,
  });

  const resumeSeconds = reviewMode
    ? 0
    : getResumeSeconds(initialWatchedSeconds, initialDurationSeconds, initialPercent);

  const [percent, setPercent] = useState(reviewMode ? 100 : initialPercent);
  const [ready, setReady] = useState(false);

  const updateLocalProgress = useCallback(
    (watched: number, duration: number) => {
      if (reviewMode) return;

      const safeWatched = Math.max(latestProgressRef.current.watched, Math.floor(watched));
      const safeDuration = Math.max(latestProgressRef.current.duration, Math.floor(duration));
      latestProgressRef.current = { watched: safeWatched, duration: safeDuration };

      if (safeDuration > 0) {
        setPercent(Math.round(Math.min(100, (safeWatched / safeDuration) * 100)));
      }
    },
    [reviewMode]
  );

  const saveProgress = useCallback(
    async (keepalive = false) => {
      if (reviewMode) return;

      const { watched, duration } = latestProgressRef.current;
      if (duration <= 0 && watched <= 0) return;

      try {
        const res = await fetch(`/api/video-progress/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchedSeconds: watched,
            durationSeconds: duration,
          }),
          keepalive,
        });

        if (res.ok) {
          const data = (await res.json()) as { progress?: { percent: number } };
          if (data.progress?.percent !== undefined) {
            setPercent(data.progress.percent);
          }
        }
      } catch {
        // Best-effort save; progress will retry on next interval
      }
    },
    [reviewMode, sessionId]
  );

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const startSaveTimer = useCallback(() => {
    clearSaveTimer();
    saveTimerRef.current = setInterval(() => {
      void saveProgress();
    }, SAVE_INTERVAL_MS);
  }, [clearSaveTimer, saveProgress]);

  const samplePlayerProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      updateLocalProgress(current, duration);
    } catch {
      // Player may be tearing down
    }
  }, [updateLocalProgress]);

  useEffect(() => {
    let cancelled = false;

    void loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      const playerVars: Record<string, string | number> = {
        rel: 0,
        modestbranding: 1,
      };

      if (resumeSeconds > 0) {
        playerVars.start = resumeSeconds;
      }

      playerRef.current = new window.YT.Player(playerElementId, {
        videoId,
        playerVars,
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
            samplePlayerProgress();
          },
          onStateChange: (event) => {
            if (reviewMode) return;

            if (event.data === YT_PLAYER_STATE.PLAYING) {
              startSaveTimer();
              samplePlayerProgress();
              return;
            }

            clearSaveTimer();
            samplePlayerProgress();

            if (
              event.data === YT_PLAYER_STATE.PAUSED ||
              event.data === YT_PLAYER_STATE.ENDED
            ) {
              if (event.data === YT_PLAYER_STATE.ENDED) {
                const duration = event.target.getDuration();
                updateLocalProgress(duration, duration);
              }
              void saveProgress();
            }
          },
        },
      });
    });

    const handlePageHide = () => {
      if (reviewMode) return;
      samplePlayerProgress();
      void saveProgress(true);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", handlePageHide);
      clearSaveTimer();
      if (!reviewMode) {
        samplePlayerProgress();
        void saveProgress(true);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [
    clearSaveTimer,
    playerElementId,
    resumeSeconds,
    samplePlayerProgress,
    saveProgress,
    startSaveTimer,
    updateLocalProgress,
    reviewMode,
    videoId,
  ]);

  return (
    <div className="space-y-4">
      {reviewMode ? (
        <p className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-text-secondary">
          <span className="font-medium text-teal">Review mode</span> - you&apos;ve already
          completed this session. Watch again anytime; your overall progress won&apos;t change.
        </p>
      ) : (
        resumeSeconds > 0 && (
          <p className="text-sm text-text-secondary">
            Resuming from{" "}
            <span className="font-medium text-teal">{formatWatchTime(resumeSeconds)}</span>
          </p>
        )
      )}

      <VideoProgressBar
        percent={percent}
        size="md"
        label={reviewMode ? "Completed" : "Video progress"}
      />

      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black aspect-video">
        <div
          id={playerElementId}
          title={title}
          className="absolute inset-0 h-full w-full"
          aria-label={title}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-text-secondary">
            Loading video…
          </div>
        )}
      </div>
    </div>
  );
}