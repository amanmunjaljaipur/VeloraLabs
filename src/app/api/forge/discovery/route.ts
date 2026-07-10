import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { applySmartDefault, runDiscoveryBatch } from "@/lib/forge/discovery";
import type { DiscoveryAnswer } from "@/lib/forge/types";
import type { InterviewQuestion, LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Adaptive discovery batch for Forge.
 * POST { prompt, priorAnswers?, batchIndex?, forceComplete?, action?: "batch"|"default", question? }
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    priorAnswers?: DiscoveryAnswer[];
    batchIndex?: number;
    forceComplete?: boolean;
    action?: "batch" | "default";
    question?: InterviewQuestion;
    archetype?: string;
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
    return NextResponse.json(
      { error: "Describe the product you want to build first." },
      { status: 400 }
    );
  }

  const secrets = body.apiKey?.trim()
    ? {
        provider: body.provider || ("xai" as const),
        apiKey: body.apiKey.trim(),
        model: body.model || "grok-3-mini",
        baseUrl: body.baseUrl,
      }
    : null;

  if (body.action === "default" && body.question) {
    const result = applySmartDefault({
      question: body.question,
      prompt,
      archetype: (body.archetype as "booking") || "custom",
    });
    return NextResponse.json(result);
  }

  const batch = await runDiscoveryBatch({
    prompt,
    priorAnswers: body.priorAnswers || [],
    batchIndex: body.batchIndex ?? 0,
    forceComplete: body.forceComplete,
    secrets,
  });

  return NextResponse.json(batch);
}
