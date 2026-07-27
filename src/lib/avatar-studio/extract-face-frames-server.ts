/**
 * Server-side high-quality frame extraction from multi-angle face videos.
 * Uses ffmpeg when available (Lanczos scale, high JPEG qscale) — same idea as
 * Gemini avatar capture: many clear stills from a short head-turn clip.
 */

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

function findFfmpeg(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  return "ffmpeg";
}

function runFfmpeg(args: string[], timeoutMs = 120_000): Promise<{ ok: true } | { ok: false; error: string }> {
  const bin = findFfmpeg();
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ok: false, error: "ffmpeg timed out extracting frames" });
    }, timeoutMs);
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 30_000) stderr = stderr.slice(-12_000);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error:
          err.message.includes("ENOENT")
            ? "ffmpeg not found — client-side extraction will be used, or install ffmpeg / set FFMPEG_PATH"
            : err.message,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: `ffmpeg frame extract failed: ${stderr.slice(-500)}` });
    });
  });
}

export interface ServerExtractedFrame {
  buffer: Buffer;
  filename: string;
  mimeType: "image/jpeg";
  widthHint: number;
}

/**
 * Extract ~targetCount high-quality JPEGs from a face video buffer.
 * Frames are evenly spaced; scaled so longest side ≤ maxSide (default 1600).
 */
export async function extractFaceFramesWithFfmpeg(
  videoBytes: Buffer,
  extHint = "mp4",
  opts?: { targetCount?: number; maxSide?: number }
): Promise<{ ok: true; frames: ServerExtractedFrame[] } | { ok: false; error: string }> {
  const targetCount = Math.min(16, Math.max(4, opts?.targetCount ?? 10));
  const maxSide = opts?.maxSide ?? 1600;
  const work = path.join(os.tmpdir(), `verlin-face-frames-${randomUUID()}`);
  fs.mkdirSync(work, { recursive: true });
  const inputPath = path.join(work, `input.${extHint.replace(/^\./, "") || "mp4"}`);
  const pattern = path.join(work, "frame_%03d.jpg");

  try {
    fs.writeFileSync(inputPath, videoBytes);

    // fps chosen so we get ~targetCount+4 candidates across a typical 8–20s clip;
    // we trim to targetCount after. High quality: lanczos + qscale 2 (~JPEG ~95).
    // select filter samples evenly when duration unknown: fps=1 is safe for short clips.
    const fps = Math.max(0.4, Math.min(2, targetCount / 8));
    const vf = [
      `fps=${fps.toFixed(3)}`,
      `scale='min(${maxSide},iw)':'min(${maxSide},ih)':force_original_aspect_ratio=decrease:flags=lanczos`,
      "format=yuvj420p",
    ].join(",");

    const run = await runFfmpeg(
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        vf,
        "-q:v",
        "2",
        "-frames:v",
        String(targetCount + 6),
        pattern,
      ],
      180_000
    );
    if (!run.ok) return run;

    const files = fs
      .readdirSync(work)
      .filter((f) => f.startsWith("frame_") && f.endsWith(".jpg"))
      .sort();

    if (files.length === 0) {
      return { ok: false, error: "ffmpeg produced no frames — try a longer, clearer face video" };
    }

    // Prefer middle frames (often better face visibility) then fill
    const frames: ServerExtractedFrame[] = [];
    const selected = files.slice(0, targetCount);
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i]!;
      const buf = fs.readFileSync(path.join(work, f));
      if (buf.length < 4_000) continue;
      frames.push({
        buffer: buf,
        filename: `face-angle-${String(i + 1).padStart(2, "0")}.jpg`,
        mimeType: "image/jpeg",
        widthHint: maxSide,
      });
    }

    if (frames.length === 0) {
      return { ok: false, error: "Extracted frames were empty or too small" };
    }
    return { ok: true, frames };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Frame extraction failed",
    };
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
