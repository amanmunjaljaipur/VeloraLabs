import { assertAgentActive } from "@/lib/agents/controls";
import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { researchProductPlan } from "@/lib/app-builder/research-plan";
import type { AppInterviewAnswer, LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * After prompt + (optional) answers: research a complete product plan.
 * User must approve this plan before generation.
 */
export async function POST(request: Request) {
  const paused = await assertAgentActive("app-vertical-research");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    answers?: AppInterviewAnswer[];
    customPoints?: string[];
    apiKey?: string;
    provider?: LlmProviderKind;
    model?: string;
    baseUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Product idea prompt is required" }, { status: 400 });
  }

  const secrets = body.apiKey?.trim()
    ? {
        provider: body.provider || ("xai" as const),
        apiKey: body.apiKey.trim(),
        model: body.model || "",
        baseUrl: body.baseUrl,
      }
    : null;

  const { plan, source } = await researchProductPlan({
    prompt,
    answers: Array.isArray(body.answers) ? body.answers : [],
    customPoints: body.customPoints,
    secrets,
  });

  return NextResponse.json({
    plan,
    source,
    message:
      "Review this plan carefully. We only build after you approve - this avoids empty brochure sites.",
  });
}
