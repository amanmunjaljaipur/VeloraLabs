import { readCmsUpload } from "@/lib/cms/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ filename: string }> };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { filename } = await context.params;
  const decoded = decodeURIComponent(filename);
  const buffer = readCmsUpload(decoded);

  if (!buffer) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = decoded.slice(decoded.lastIndexOf(".")).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}