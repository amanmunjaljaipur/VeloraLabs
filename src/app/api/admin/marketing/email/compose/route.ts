import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateColdEmail } from "@/lib/marketing/ai-email-templates";
import { isLlmConfigured } from "@/lib/chat/llm-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Body: { prompt, prospectName?, prospectCompany?, prospectTitle? } - AI drafts one personalized cold email. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isLlmConfigured()) {
    return NextResponse.json({ error: "AI is not configured (set GROQ_API_KEY or GEMINI_API_KEY)" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  try {
    const result = await generateColdEmail({
      prompt,
      prospectName: typeof body?.prospectName === "string" ? body.prospectName : null,
      prospectCompany: typeof body?.prospectCompany === "string" ? body.prospectCompany : null,
      prospectTitle: typeof body?.prospectTitle === "string" ? body.prospectTitle : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Compose failed" },
      { status: 502 }
    );
  }
}
