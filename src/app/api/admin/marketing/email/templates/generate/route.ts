import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateEmailTemplate, isEmailTemplateAiConfigured } from "@/lib/marketing/ai-email-templates";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Body: { prompt, includeImage?, imageStyle? } - AI drafts a subject + HTML body, optionally with a generated header image. Does NOT save it; POST the result to /templates to save. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isEmailTemplateAiConfigured()) {
    return NextResponse.json({ error: "AI is not configured (set GROQ_API_KEY or GEMINI_API_KEY)" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  try {
    const result = await generateEmailTemplate({
      prompt,
      includeImage: Boolean(body?.includeImage),
      imageStyle: typeof body?.imageStyle === "string" ? body.imageStyle : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Template generation failed" },
      { status: 502 }
    );
  }
}
