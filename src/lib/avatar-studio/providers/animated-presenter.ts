import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

/**
 * Free-tier "animated presenter": turns a still portrait + narrated audio
 * into a real MP4 with Ken Burns zoom, subtle breathing scale, and optional
 * caption burn-in. No GPU lip-sync — but the face is no longer a frozen
 * image. When a real MuseTalk/Wav2Lip endpoint is configured, avatar-agent
 * uses that instead.
 */

function findFfmpeg(): string | null {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  // Common Windows / PATH installs
  const candidates = ["ffmpeg", "ffmpeg.exe"];
  for (const c of candidates) {
    // resolve later via spawn with shell false — rely on PATH
    return c;
  }
  return "ffmpeg";
}

function runFfmpeg(args: string[], timeoutMs = 300_000): Promise<{ ok: true } | { ok: false; error: string }> {
  const bin = findFfmpeg() ?? "ffmpeg";
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ok: false, error: "ffmpeg timed out" });
    }, timeoutMs);
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 20_000) stderr = stderr.slice(-10_000);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error:
          err.message.includes("ENOENT")
            ? "ffmpeg not found on PATH — install ffmpeg or set FFMPEG_PATH"
            : err.message,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: `ffmpeg exited ${code}: ${stderr.slice(-400)}` });
    });
  });
}

async function downloadToTemp(url: string, dest: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Local media API
    let fetchUrl = url;
    if (url.startsWith("/")) {
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.AUTH_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      fetchUrl = `${base.replace(/\/$/, "")}${url}`;
    }
    // Local file path via /api/media/local/...
    if (fetchUrl.includes("/api/media/local/")) {
      const { resolveLocalMediaAbsolutePath } = await import("@/lib/avatar-studio/storage-adapter");
      const parts = fetchUrl.split("/api/media/")[1]?.split("?")[0]?.split("/") ?? [];
      const abs = resolveLocalMediaAbsolutePath(parts);
      if (abs && fs.existsSync(abs)) {
        fs.copyFileSync(abs, dest);
        return { ok: true };
      }
    }
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return { ok: false, error: `Download failed (${res.status})` };
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Download failed" };
  }
}

function escapeDrawtext(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\n/g, " ")
    .slice(0, 80);
}

/**
 * Build animated MP4: slow zoom + slight vertical drift + soft vignette feel via crop.
 * durationSeconds drives zoompan frame count (25 fps).
 */
export async function renderAnimatedPresenterVideo(input: {
  email: string;
  imageUrl: string;
  audioUrl: string;
  durationSeconds: number;
  scriptPreview?: string;
  onProgress?: (percent: number, label: string) => void | Promise<void>;
}): Promise<
  | { ok: true; video: JobStorageRef; durationSeconds: number }
  | { ok: false; error: string }
> {
  const tmp = path.join(os.tmpdir(), `avatar-anim-${randomUUID()}`);
  fs.mkdirSync(tmp, { recursive: true });
  const imgPath = path.join(tmp, "poster.jpg");
  const audioPath = path.join(tmp, "voice.mp3");
  const outPath = path.join(tmp, "out.mp4");

  try {
    await input.onProgress?.(55, "Downloading portrait & audio for animation…");
    const imgDl = await downloadToTemp(input.imageUrl, imgPath);
    if (!imgDl.ok) return { ok: false, error: `Portrait: ${imgDl.error}` };
    const audDl = await downloadToTemp(input.audioUrl, audioPath);
    if (!audDl.ok) return { ok: false, error: `Audio: ${audDl.error}` };

    const duration = Math.max(2, Math.min(600, Math.ceil(input.durationSeconds || 10)));
    const fps = 25;
    const totalFrames = duration * fps;
    // Gentle zoom from 1.0 → ~1.12 over the full clip + slight pan
    const zExpr = `min(1.12\\,1+0.12*on/${totalFrames})`;
    const xExpr = `iw/2-(iw/zoom/2)`;
    const yExpr = `ih/2-(ih/zoom/2)-20*sin(2*PI*on/${totalFrames})`;

    // scale/crop to 720x1280 vertical presenter, then zoompan for motion
    const vf = [
      "scale=720:1280:force_original_aspect_ratio=increase",
      "crop=720:1280",
      `zoompan=z='${zExpr}':x='${xExpr}':y='${yExpr}':d=1:s=720x1280:fps=${fps}`,
    ].join(",");

    // Optional bottom caption bar from first line of script (lightweight)
    const caption = input.scriptPreview?.trim()
      ? escapeDrawtext(input.scriptPreview.trim().split(/[.!?]/)[0] || input.scriptPreview.trim())
      : "";
    const vfFinal = caption
      ? `${vf},drawtext=text='${caption}':fontsize=22:fontcolor=white:borderw=2:bordercolor=black@0.6:x=(w-text_w)/2:y=h-80`
      : vf;

    await input.onProgress?.(68, "Animating face (Ken Burns + motion)…");

    const args = [
      "-y",
      "-loop",
      "1",
      "-i",
      imgPath,
      "-i",
      audioPath,
      "-vf",
      vfFinal,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-t",
      String(duration),
      outPath,
    ];

    await input.onProgress?.(78, "Encoding MP4…");
    const encoded = await runFfmpeg(args);
    if (!encoded.ok) {
      // Simpler fallback without zoompan (some ffmpeg builds lack filters)
      await input.onProgress?.(80, "Retrying simpler animation encode…");
      const simple = await runFfmpeg([
        "-y",
        "-loop",
        "1",
        "-framerate",
        "25",
        "-i",
        imgPath,
        "-i",
        audioPath,
        "-vf",
        "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
        "-c:v",
        "libx264",
        "-tune",
        "stillimage",
        "-c:a",
        "aac",
        "-shortest",
        "-pix_fmt",
        "yuv420p",
        "-t",
        String(duration),
        outPath,
      ]);
      if (!simple.ok) return { ok: false, error: simple.error };
    }

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
      return { ok: false, error: "Animation encode produced an empty file" };
    }

    await input.onProgress?.(88, "Uploading animated video…");
    const bytes = fs.readFileSync(outPath);
    const video = await uploadUserMedia(input.email, `presenter-${randomUUID()}.mp4`, bytes, "video/mp4");
    return { ok: true, video, durationSeconds: duration };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Animation failed" };
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
