/**
 * Download free meme clips and stitch them into the presenter video at
 * script-suggested positions (ffmpeg concat).
 */

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { getClipById } from "@/lib/avatar-studio/meme-catalog";
import { downloadFreeVideoBuffer, resolveClipId } from "@/lib/avatar-studio/meme-resolve";
import type { SelectedMemePlacement } from "@/lib/avatar-studio/meme-suggest";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

function findFfmpeg(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  return "ffmpeg";
}

function runFfmpeg(args: string[], timeoutMs = 180_000): Promise<{ ok: true } | { ok: false; error: string }> {
  const bin = findFfmpeg();
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ok: false, error: "ffmpeg timed out stitching memes" });
    }, timeoutMs);
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 40_000) stderr = stderr.slice(-15_000);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: err.message.includes("ENOENT") ? "ffmpeg not found" : err.message,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: `ffmpeg stitch failed: ${stderr.slice(-400)}` });
    });
  });
}

async function downloadMainVideo(url: string, dest: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    let fetchUrl = url;
    if (url.startsWith("/")) {
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.AUTH_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      fetchUrl = `${base.replace(/\/$/, "")}${url}`;
    }
    if (fetchUrl.includes("/api/media/local/")) {
      const { resolveLocalMediaAbsolutePath } = await import("@/lib/avatar-studio/storage-adapter");
      const parts = fetchUrl.split("/api/media/")[1]?.split("?")[0]?.split("/") ?? [];
      const abs = resolveLocalMediaAbsolutePath(parts);
      if (abs && fs.existsSync(abs)) {
        fs.copyFileSync(abs, dest);
        return { ok: true };
      }
    }
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) return { ok: false, error: `Main video download ${res.status}` };
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Main download failed" };
  }
}

/**
 * Insert free meme clips into main MP4 at positionRatio points.
 * Returns new video ref or null if stitch skipped/failed (non-fatal).
 */
export async function stitchMemesIntoVideo(input: {
  email: string;
  mainVideoUrl: string;
  mainDurationSeconds: number;
  placements: SelectedMemePlacement[];
  onProgress?: (percent: number, label: string) => void | Promise<void>;
}): Promise<{ ok: true; video: JobStorageRef; durationSeconds: number } | { ok: false; error: string }> {
  const placements = [...input.placements]
    .filter((p) => p.clipId)
    .sort((a, b) => a.positionRatio - b.positionRatio)
    .slice(0, 5);

  if (placements.length === 0) {
    return { ok: false, error: "No meme placements selected" };
  }

  const work = path.join(os.tmpdir(), `meme-stitch-${randomUUID()}`);
  fs.mkdirSync(work, { recursive: true });
  const mainPath = path.join(work, "main.mp4");
  const outPath = path.join(work, "with-memes.mp4");

  try {
    await input.onProgress?.(92, "Downloading free meme clips…");
    const mainDl = await downloadMainVideo(input.mainVideoUrl, mainPath);
    if (!mainDl.ok) return { ok: false, error: mainDl.error };

    const duration = Math.max(3, input.mainDurationSeconds || 10);
    // Build cut points in main timeline
    const cuts = placements.map((p) => Math.min(duration - 0.5, Math.max(0.4, p.positionRatio * duration)));

    // Prepare normalized meme segments (720x1280, short, silent-friendly)
    const memePaths: string[] = [];
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]!;
      const resolved = await resolveClipId(p.clipId);
      const clip = resolved?.clip ?? getClipById(p.clipId);
      if (!clip) continue;
      const preferred = p.sourceUrl || resolved?.url || clip.fallbackUrl;
      const dl = await downloadFreeVideoBuffer(preferred, clip.fallbackUrl);
      const rawPath = path.join(work, `meme-raw-${i}.mp4`);
      const normPath = path.join(work, `meme-norm-${i}.mp4`);
      if (!dl.ok) {
        // Generate a free title-card "meme" slide with ffmpeg (always works offline)
        const card = await runFfmpeg([
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=0x0f172a:s=720x1280:d=${Math.min(3, clip.durationSeconds)}`,
          "-vf",
          `drawtext=text='${clip.title.replace(/'/g, "")}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-t",
          String(Math.min(3, clip.durationSeconds)),
          normPath,
        ]);
        if (card.ok && fs.existsSync(normPath)) memePaths.push(normPath);
        continue;
      }
      fs.writeFileSync(rawPath, dl.bytes);
      const clipDur = Math.min(3, Math.max(1.5, clip.durationSeconds));
      const norm = await runFfmpeg([
        "-y",
        "-i",
        rawPath,
        "-t",
        String(clipDur),
        "-vf",
        "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=25",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-an",
        "-pix_fmt",
        "yuv420p",
        normPath,
      ]);
      if (norm.ok && fs.existsSync(normPath)) {
        memePaths.push(normPath);
      }
    }

    if (memePaths.length === 0) {
      return { ok: false, error: "No free meme clips could be downloaded" };
    }

    await input.onProgress?.(94, "Cutting presenter & inserting free memes…");

    // Split main into segments around cut points (use first N cuts matching meme count)
    const activeCuts = cuts.slice(0, memePaths.length);
    const segmentPaths: string[] = [];
    let lastT = 0;
    for (let i = 0; i < activeCuts.length; i++) {
      const t = activeCuts[i]!;
      const segPath = path.join(work, `main-seg-${i}.mp4`);
      const len = Math.max(0.3, t - lastT);
      const cut = await runFfmpeg([
        "-y",
        "-ss",
        String(lastT),
        "-i",
        mainPath,
        "-t",
        String(len),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-pix_fmt",
        "yuv420p",
        segPath,
      ]);
      if (cut.ok && fs.existsSync(segPath)) segmentPaths.push(segPath);
      lastT = t;
    }
    // Tail of main
    const tailPath = path.join(work, "main-tail.mp4");
    const tail = await runFfmpeg([
      "-y",
      "-ss",
      String(lastT),
      "-i",
      mainPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-pix_fmt",
      "yuv420p",
      tailPath,
    ]);
    if (tail.ok && fs.existsSync(tailPath)) segmentPaths.push(tailPath);

    if (segmentPaths.length < 2) {
      return { ok: false, error: "Could not split main video for meme inserts" };
    }

    // Interleave: seg0, meme0, seg1, meme1, ... tail
    const concatList: string[] = [];
    let mi = 0;
    for (let i = 0; i < segmentPaths.length; i++) {
      concatList.push(segmentPaths[i]!);
      if (i < segmentPaths.length - 1 && mi < memePaths.length) {
        // Meme as video+silent audio matching format
        const memeWithAudio = path.join(work, `meme-a-${mi}.mp4`);
        const mem = await runFfmpeg([
          "-y",
          "-i",
          memePaths[mi]!,
          "-f",
          "lavfi",
          "-i",
          "anullsrc=channel_layout=stereo:sample_rate=44100",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-shortest",
          memeWithAudio,
        ]);
        concatList.push(mem.ok && fs.existsSync(memeWithAudio) ? memeWithAudio : memePaths[mi]!);
        mi++;
      }
    }

    // Re-encode all parts to uniform streams for concat demuxer safety
    const uniform: string[] = [];
    for (let i = 0; i < concatList.length; i++) {
      const u = path.join(work, `u-${i}.mp4`);
      const r = await runFfmpeg([
        "-y",
        "-i",
        concatList[i]!,
        "-vf",
        "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=25",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-pix_fmt",
        "yuv420p",
        "-t",
        "30",
        u,
      ]);
      if (r.ok && fs.existsSync(u)) uniform.push(u);
    }

    const listFile = path.join(work, "list.txt");
    fs.writeFileSync(
      listFile,
      uniform.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n")
    );

    await input.onProgress?.(96, "Encoding final video with free memes…");
    const concat = await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      outPath,
    ]);

    if (!concat.ok || !fs.existsSync(outPath)) {
      return { ok: false, error: concat.ok === false ? concat.error : "Concat produced no file" };
    }

    const bytes = fs.readFileSync(outPath);
    if (bytes.byteLength < 2000) return { ok: false, error: "Stitched file too small" };

    const video = await uploadUserMedia(
      input.email,
      `presenter-memes-${randomUUID()}.mp4`,
      bytes,
      "video/mp4"
    );
    const extra = memePaths.length * 2.2;
    return {
      ok: true,
      video,
      durationSeconds: Math.ceil(duration + extra),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Meme stitch failed" };
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
