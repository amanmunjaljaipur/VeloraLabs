import { requireAppCapability } from "@/lib/app-builder/app-auth";
import {
  clientIpFromRequest,
  detectImageKind,
  isAllowedImageMime,
} from "@/lib/app-builder/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

const MAX_BYTES = 6 * 1024 * 1024; // 6MB

/**
 * Upload a product photo, logo, or theme reference image for this shop.
 * Magic-byte validated (blocks SVG/HTML spoofing). Auth required.
 */
export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "products.edit")) ||
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIpFromRequest(request);
  const rl = checkRateLimit(`app-upload:${slug}:${ip}`, 30, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec || 60) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  // Strict MIME allow-list only (no image/* open-ended - blocks image/svg+xml)
  if (!isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP, or GIF images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 6 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kindDetected = detectImageKind(buffer);
  if (!kindDetected) {
    return NextResponse.json(
      { error: "File content is not a valid image (upload rejected)" },
      { status: 400 }
    );
  }

  const kind = String(form.get("kind") || "image").replace(/[^a-z0-9_-]/gi, "") || "image";
  const ext = kindDetected === "jpeg" ? "jpg" : kindDetected;
  const contentType =
    kindDetected === "jpeg"
      ? "image/jpeg"
      : kindDetected === "png"
        ? "image/png"
        : kindDetected === "webp"
          ? "image/webp"
          : "image/gif";

  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 64) || "app";
  const key = `app-builder/${safeSlug}/${kind}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(key, buffer, {
        access: "public",
        contentType,
        addRandomSuffix: false,
      });
      return NextResponse.json({ url: blob.url, kind });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const b64 = buffer.toString("base64");
  const url = `data:${contentType};base64,${b64}`;
  return NextResponse.json({
    url,
    kind,
    warning: "Stored as data URL (set BLOB_READ_WRITE_TOKEN for production)",
  });
}
