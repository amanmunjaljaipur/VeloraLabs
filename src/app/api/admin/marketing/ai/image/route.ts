import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateMarketingImage, isAiImageConfigured } from "@/lib/marketing/ai-image";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** AI image generation for the Marketing Board composer - free (Pollinations), re-hosted on Blob. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isAiImageConfigured()) {
    return NextResponse.json({ error: "Image generation is not configured yet" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt || prompt.length > 500) {
    return NextResponse.json({ error: "Describe the image in 1-500 characters" }, { status: 400 });
  }

  const result = await generateMarketingImage(prompt);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ url: result.url });
}
