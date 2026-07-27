/**
 * Browser-side multi-angle face frame extraction (Gemini-style training bank).
 *
 * Loads a short face-turn video, samples high-resolution frames across time,
 * scores brightness/contrast, prefers visually diverse frames (different head
 * angles), and exports high-quality JPEGs for the character image bank.
 *
 * No server/ffmpeg required — works on localhost and production HTTPS.
 */

export interface ExtractFaceFramesOptions {
  /** Target number of training stills (default 10). */
  targetCount?: number;
  /** How many candidate times to sample before picking best (default 28). */
  candidateCount?: number;
  /** JPEG quality 0–1 (default 0.95 for training quality). */
  jpegQuality?: number;
  /** Cap longest side of output (default 1600). Keeps HQ without huge uploads. */
  maxSide?: number;
  onProgress?: (percent: number, label: string) => void;
}

export interface ExtractedFaceFrame {
  file: File;
  previewUrl: string;
  /** 0–1 relative quality score used during selection */
  score: number;
  timeSeconds: number;
  width: number;
  height: number;
}

export interface ExtractFaceFramesResult {
  frames: ExtractedFaceFrame[];
  durationSeconds: number;
  sourceWidth: number;
  sourceHeight: number;
}

function waitEvent(el: EventTarget, event: string, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`Video error during ${event}`));
    };
    const cleanup = () => {
      clearTimeout(t);
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.04) return;
  video.currentTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.05));
  await waitEvent(video, "seeked", 8_000);
}

/** Simple luminance histogram variance + edge energy proxy for "usable face frame". */
function scoreCanvas(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const sample = Math.min(w, 160);
  const sampleH = Math.max(1, Math.round((h / w) * sample));
  const tmp = document.createElement("canvas");
  tmp.width = sample;
  tmp.height = sampleH;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  if (!tctx) return 0;
  tctx.drawImage(ctx.canvas, 0, 0, sample, sampleH);
  const { data } = tctx.getImageData(0, 0, sample, sampleH);
  let sum = 0;
  let sumSq = 0;
  let edge = 0;
  const n = sample * sampleH;
  for (let i = 0; i < data.length; i += 4) {
    const y = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    sum += y;
    sumSq += y * y;
  }
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  // Horizontal gradient energy (cheap sharpness proxy)
  for (let row = 0; row < sampleH; row++) {
    for (let col = 1; col < sample; col++) {
      const i = (row * sample + col) * 4;
      const j = (row * sample + col - 1) * 4;
      const y1 = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      const y0 = 0.299 * data[j]! + 0.587 * data[j + 1]! + 0.114 * data[j + 2]!;
      edge += Math.abs(y1 - y0);
    }
  }
  const edgeNorm = edge / n;
  // Reject near-black / near-white / flat frames
  if (mean < 12 || mean > 245 || variance < 80) return 0;
  return variance * 0.65 + edgeNorm * 8;
}

/** Downsample RGB fingerprint for diversity (different angles look different). */
function fingerprint(ctx: CanvasRenderingContext2D, w: number, h: number): Float32Array {
  const size = 16;
  const tmp = document.createElement("canvas");
  tmp.width = size;
  tmp.height = size;
  const tctx = tmp.getContext("2d", { willReadFrequently: true })!;
  tctx.drawImage(ctx.canvas, 0, 0, size, size);
  const { data } = tctx.getImageData(0, 0, size, size);
  const fp = new Float32Array(size * size);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    fp[p] = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return fp;
}

function distance(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    s += d * d;
  }
  return Math.sqrt(s / a.length);
}

/**
 * Extract high-quality, multi-angle stills from a face-turn video.
 */
export async function extractFaceFramesFromVideo(
  source: File | Blob,
  opts: ExtractFaceFramesOptions = {}
): Promise<ExtractFaceFramesResult> {
  const targetCount = Math.min(16, Math.max(4, opts.targetCount ?? 10));
  const candidateCount = Math.min(40, Math.max(targetCount + 4, opts.candidateCount ?? 28));
  const jpegQuality = opts.jpegQuality ?? 0.95;
  const maxSide = opts.maxSide ?? 1600;
  const onProgress = opts.onProgress;

  onProgress?.(2, "Loading face video…");

  const objectUrl = URL.createObjectURL(source);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = objectUrl;

  try {
    await waitEvent(video, "loadedmetadata");
    // Some browsers need play/pause to unlock decode
    try {
      await video.play();
      video.pause();
    } catch {
      /* ignore autoplay restrictions */
    }

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const srcW = video.videoWidth || 720;
    const srcH = video.videoHeight || 960;
    let outW = srcW;
    let outH = srcH;
    if (Math.max(srcW, srcH) > maxSide) {
      const scale = maxSide / Math.max(srcW, srcH);
      outW = Math.round(srcW * scale);
      outH = Math.round(srcH * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false });
    if (!ctx) throw new Error("Canvas not available");

    type Cand = {
      time: number;
      score: number;
      fp: Float32Array;
      blob: Blob;
      width: number;
      height: number;
    };
    const candidates: Cand[] = [];

    // Sample across the clip (skip first/last 4% — often motion blur / idle)
    const start = duration * 0.04;
    const end = duration * 0.96;
    const span = Math.max(0.2, end - start);

    for (let i = 0; i < candidateCount; i++) {
      const t = start + (span * i) / Math.max(1, candidateCount - 1);
      onProgress?.(
        5 + Math.round((i / candidateCount) * 70),
        `Scanning angles… ${i + 1}/${candidateCount}`
      );
      try {
        await seekVideo(video, t);
      } catch {
        continue;
      }
      // High-quality draw (no smoothing soft-blur for faces)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(video, 0, 0, outW, outH);
      const score = scoreCanvas(ctx, outW, outH);
      if (score <= 0) continue;
      const fp = fingerprint(ctx, outW, outH);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", jpegQuality)
      );
      if (!blob || blob.size < 8_000) continue; // skip tiny/failed encodes
      candidates.push({ time: t, score, fp, blob, width: outW, height: outH });
    }

    if (candidates.length === 0) {
      throw new Error(
        "Could not pull clear face frames from this video. Use better light, hold the phone steady, and slowly turn left → center → right."
      );
    }

    onProgress?.(80, "Picking best multi-angle stills…");

    // Greedy diversity pick: start with sharpest, then farthest fingerprints
    candidates.sort((a, b) => b.score - a.score);
    const picked: Cand[] = [candidates[0]!];
    while (picked.length < targetCount && picked.length < candidates.length) {
      let best: Cand | null = null;
      let bestMetric = -1;
      for (const c of candidates) {
        if (picked.includes(c)) continue;
        const minDist = Math.min(...picked.map((p) => distance(p.fp, c.fp)));
        // Prefer different angles (distance) while keeping quality
        const metric = minDist * 1.4 + c.score * 0.02;
        if (metric > bestMetric) {
          bestMetric = metric;
          best = c;
        }
      }
      if (!best) break;
      // Require some diversity unless we are short on candidates
      const minDist = Math.min(...picked.map((p) => distance(p.fp, best!.fp)));
      if (minDist < 4 && picked.length >= Math.min(4, targetCount) && candidates.length > targetCount) {
        // skip near-duplicates late in selection — mark by removing from pool
        const idx = candidates.indexOf(best);
        if (idx >= 0) candidates.splice(idx, 1);
        continue;
      }
      picked.push(best);
    }

    // Chronological order helps users see left→center→right
    picked.sort((a, b) => a.time - b.time);

    const frames: ExtractedFaceFrame[] = [];
    for (let i = 0; i < picked.length; i++) {
      const c = picked[i]!;
      const file = new File([c.blob], `face-angle-${String(i + 1).padStart(2, "0")}.jpg`, {
        type: "image/jpeg",
      });
      frames.push({
        file,
        previewUrl: URL.createObjectURL(c.blob),
        score: c.score,
        timeSeconds: c.time,
        width: c.width,
        height: c.height,
      });
      onProgress?.(85 + Math.round((i / picked.length) * 12), `Encoding frame ${i + 1}/${picked.length}`);
    }

    onProgress?.(100, `Extracted ${frames.length} high-quality training stills`);
    return {
      frames,
      durationSeconds: duration,
      sourceWidth: srcW,
      sourceHeight: srcH,
    };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
