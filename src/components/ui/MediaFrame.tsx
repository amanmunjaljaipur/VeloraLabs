"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface MediaFrameProps {
  image: string;
  alt: string;
  video?: string | null;
  className?: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  rounded?: boolean;
  /** Prefer "none" when the frame has on-image text (keeps labels sharp) */
  scrim?: "none" | "soft" | "strong" | "bottom";
  sizes?: string;
  /**
   * Text-heavy marketing clips: no Ken Burns, no dark haze, sharper rendering.
   * Defaults true when a video src is present.
   */
  sharpText?: boolean;
}

/**
 * Poster + optional muted loop.
 * For labelled videos, sharpText keeps type readable (no haze overlays / zoom blur).
 */
export function MediaFrame({
  image,
  alt,
  video,
  className,
  fit = "cover",
  priority = false,
  rounded = true,
  scrim,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  sharpText,
}: MediaFrameProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideoLayer, setShowVideoLayer] = useState(false);
  const [broken, setBroken] = useState(false);
  const [inView, setInView] = useState(priority);

  const enableVideo = Boolean(video) && reduceMotion !== true && !broken;
  const keepTextSharp = sharpText ?? Boolean(video);
  const activeScrim = scrim ?? (keepTextSharp ? "none" : "soft");

  useEffect(() => {
    setShowVideoLayer(false);
    setBroken(false);
  }, [video]);

  useEffect(() => {
    if (priority) {
      setInView(true);
      return;
    }
    if (!rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [priority]);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || reduceMotion === true) return;
    try {
      el.muted = true;
      el.setAttribute("muted", "");
      el.playsInline = true;
      const result = el.play();
      if (result !== undefined) {
        void result
          .then(() => setShowVideoLayer(true))
          .catch(() => {
            /* autoplay may retry */
          });
      }
    } catch {
      /* ignore */
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!enableVideo || !inView) return;
    tryPlay();
    const t1 = window.setTimeout(tryPlay, 300);
    const t2 = window.setTimeout(tryPlay, 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [enableVideo, inView, video, tryPlay]);

  useEffect(() => {
    if (!enableVideo) return;
    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enableVideo, tryPlay]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative overflow-hidden bg-[var(--surface-dark)]",
        rounded && "rounded-2xl",
        keepTextSharp && "media-frame-sharp",
        className
      )}
    >
      {/* Crisp poster (no Ken Burns when labels must stay sharp) */}
      <Image
        src={image}
        alt={alt}
        fill
        priority={priority}
        quality={keepTextSharp ? 90 : 75}
        className={cn(
          "z-0",
          fit === "cover" ? "object-cover" : "object-contain",
          "object-center",
          !reduceMotion && !showVideoLayer && !keepTextSharp && "hero-ken-burns"
        )}
        sizes={sizes}
      />

      {enableVideo && inView && video ? (
        <video
          key={video}
          ref={videoRef}
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] h-full w-full object-center",
            fit === "cover" ? "object-cover" : "object-contain",
            showVideoLayer ? "opacity-100" : "opacity-0",
            keepTextSharp && "media-frame-video-sharp"
          )}
          style={{
            transition: "opacity 280ms ease",
            // Prefer crisp edges over soft upscaling
            imageRendering: keepTextSharp ? "auto" : undefined,
          }}
          src={video}
          poster={image}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={tryPlay}
          onCanPlay={tryPlay}
          onCanPlayThrough={tryPlay}
          onPlaying={() => setShowVideoLayer(true)}
          onError={() => setBroken(true)}
        />
      ) : null}

      {/* Very light edge only - never a full haze that washes out type */}
      {activeScrim === "soft" && (
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/12 via-transparent to-transparent" />
      )}
      {activeScrim === "strong" && (
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[var(--surface-dark)]/50 via-transparent to-[var(--surface-dark)]/15" />
      )}
      {activeScrim === "bottom" && (
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[var(--surface-dark)]/35 via-transparent to-transparent" />
      )}
    </div>
  );
}
