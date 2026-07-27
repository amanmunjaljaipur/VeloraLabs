import { get } from "@vercel/blob";
import { resolveLocalMediaAbsolutePath } from "@/lib/avatar-studio/storage-adapter";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Public delivery proxy for:
 * - Vercel Blob private objects (pathname = verlin-labs/...)
 * - Local avatar media (pathname = local/user/file) when Blob is not configured
 */

function readLocalMime(abs: string): string {
  try {
    const metaPath = `${abs}.meta.json`;
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as { mimeType?: string };
      if (meta.mimeType) return meta.mimeType;
    }
  } catch {
    /* ignore */
  }
  const ext = path.extname(abs).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await context.params;
  const segments = parts ?? [];
  if (segments.length === 0) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Local disk fallback (dev without BLOB_READ_WRITE_TOKEN)
  if (segments[0] === "local") {
    const abs = resolveLocalMediaAbsolutePath(segments);
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
    const buf = fs.readFileSync(abs);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": readLocalMime(abs),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const pathname = segments.join("/");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Not found (Blob not configured)", { status: 404 });
  }

  const result = await get(pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
