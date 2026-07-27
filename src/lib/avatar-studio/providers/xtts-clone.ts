/**
 * Open-source free zero-shot voice cloning via Coqui XTTS-v2 (local Python).
 *
 * Model: tts_models/multilingual/multi-dataset/xtts_v2 (Coqui — free OSS)
 * Script: scripts/voice_clone_xtts.py
 *
 * First run downloads the model (~1.8GB). CPU works; GPU optional.
 */

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { downloadMediaBytes } from "@/lib/avatar-studio/storage-adapter";

const SCRIPT = path.join(process.cwd(), "scripts", "voice_clone_xtts.py");

function pythonBin(): string {
  return (
    process.env.VOICE_CLONE_PYTHON?.trim() ||
    process.env.PYTHON?.trim() ||
    (process.platform === "win32" ? "python" : "python3")
  );
}

function runPython(
  args: string[],
  timeoutMs: number
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(pythonBin(), args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ code: -1, stdout, stderr: stderr + "\n[timeout]" });
    }, timeoutMs);
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > 200_000) stdout = stdout.slice(-100_000);
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: err.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

export async function isXttsAvailable(): Promise<{
  ok: boolean;
  torch?: string;
  tts?: string;
  cuda?: boolean;
  error?: string;
}> {
  if (!fs.existsSync(SCRIPT)) {
    return { ok: false, error: "voice_clone_xtts.py missing" };
  }
  const r = await runPython([SCRIPT, "--check"], 60_000);
  try {
    const line = r.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .pop();
    if (!line) return { ok: false, error: r.stderr.slice(-300) || "no output" };
    return JSON.parse(line) as { ok: boolean; torch?: string; tts?: string; cuda?: boolean; error?: string };
  } catch {
    return { ok: false, error: (r.stderr || r.stdout).slice(-400) };
  }
}

/**
 * Clone voice: speak `text` in the timbre of the reference audio at `speakerUrl`.
 */
export async function cloneVoiceWithXtts(input: {
  text: string;
  speakerUrl: string;
  language?: string;
}): Promise<
  | { ok: true; audio: Buffer; mimeType: string; durationSeconds: number; model: string; device: string }
  | { ok: false; error: string }
> {
  const cleaned = input.text.replace(/\s+/g, " ").trim();
  if (!cleaned) return { ok: false, error: "Empty script" };
  if (!input.speakerUrl) return { ok: false, error: "No speaker sample URL" };

  const work = path.join(os.tmpdir(), `xtts-clone-${randomUUID()}`);
  fs.mkdirSync(work, { recursive: true });
  const speakerPath = path.join(work, "speaker_raw");
  const outPath = path.join(work, "cloned.wav");

  try {
    const dl = await downloadMediaBytes(input.speakerUrl);
    if (!dl.ok) return { ok: false, error: `Speaker download: ${dl.error}` };

    const ext =
      dl.mimeType.includes("webm")
        ? ".webm"
        : dl.mimeType.includes("wav")
          ? ".wav"
          : dl.mimeType.includes("mpeg") || dl.mimeType.includes("mp3")
            ? ".mp3"
            : ".bin";
    const speakerFile = speakerPath + ext;
    fs.writeFileSync(speakerFile, dl.bytes);

    // XTTS can be slow on CPU for long scripts — cap reasonable length
    const text =
      cleaned.length > 2500 ? cleaned.slice(0, 2500) : cleaned;

    const r = await runPython(
      [
        SCRIPT,
        "--text",
        text,
        "--speaker",
        speakerFile,
        "--out",
        outPath,
        "--language",
        input.language || "en",
      ],
      // first run downloads model; allow long timeout
      Number(process.env.XTTS_TIMEOUT_MS || 900_000)
    );

    let parsed: { ok?: boolean; error?: string; bytes?: number; device?: string; model?: string } | null =
      null;
    try {
      const line = r.stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .pop();
      if (line) parsed = JSON.parse(line);
    } catch {
      /* ignore */
    }

    if (r.code !== 0 || !parsed?.ok || !fs.existsSync(outPath)) {
      const err =
        parsed?.error ||
        r.stderr.slice(-500) ||
        r.stdout.slice(-300) ||
        `xtts exit ${r.code}`;
      return { ok: false, error: err };
    }

    const audio = fs.readFileSync(outPath);
    if (audio.byteLength < 1000) return { ok: false, error: "XTTS output too small" };

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

    return {
      ok: true,
      audio,
      mimeType: "audio/wav",
      durationSeconds,
      model: parsed.model || "xtts_v2",
      device: parsed.device || "cpu",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "XTTS clone failed" };
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
