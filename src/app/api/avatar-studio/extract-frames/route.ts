import { auth } from "@/auth";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { extractFaceFramesWithFfmpeg } from "@/lib/avatar-studio/extract-face-frames-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_VIDEO_BYTES = 120 * 1024 * 1024; // 120MB

/**
 * POST multipart video → high-quality JPEG frames (base64) for character training bank.
 * Prefer client extraction for snappy UI; this path uses ffmpeg when available for HQ.
 *
 * Form: file (video), optional targetCount (4–16)
 * Response: { frames: [{ filename, mimeType, base64, byteLength }], engine: "ffmpeg"|"unavailable" }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const consented = await hasCurrentConsent(email, "voice_face_clone");
  if (!consented) {
    return NextResponse.json({ error: "consent_required" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-extract-frames:${email}:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many extract requests, try later" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name)) {
    return NextResponse.json({ error: "File must be a video" }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Video too large (max 120MB)" }, { status: 400 });
  }

  let targetCount = 10;
  const tc = form.get("targetCount");
  if (typeof tc === "string" && tc) {
    const n = Number.parseInt(tc, 10);
    if (!Number.isNaN(n)) targetCount = Math.min(16, Math.max(4, n));
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    (file.type.includes("webm") ? "webm" : file.type.includes("quicktime") ? "mov" : "mp4");

  const result = await extractFaceFramesWithFfmpeg(bytes, ext, { targetCount, maxSide: 1600 });
  if (!result.ok) {
    // Client should fall back to browser extraction
    return NextResponse.json(
      {
        error: result.error,
        engine: "unavailable",
        fallback: "client",
        hint: "Use in-browser multi-angle extraction (works without ffmpeg).",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    engine: "ffmpeg",
    frameCount: result.frames.length,
    frames: result.frames.map((f) => ({
      filename: f.filename,
      mimeType: f.mimeType,
      byteLength: f.buffer.length,
      base64: f.buffer.toString("base64"),
    })),
    note: "High-quality stills extracted for multi-angle face training (Gemini-style).",
  });
}
