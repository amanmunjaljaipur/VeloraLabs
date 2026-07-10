import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { buildForgePlan } from "@/lib/forge/plan";
import { researchCompetitors } from "@/lib/forge/competitor-research";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * App Builder V2 — single-prompt research.
 * One prompt in, one deep research pass out: full build plan (reusing Forge's
 * plan engine with no discovery Q&A) plus a competitor scan. No back-and-forth.
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
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
    return NextResponse.json({ error: "Describe what you want to build" }, { status: 400 });
  }

  const secrets = resolveAppBuilderSecrets({
    apiKey: body.apiKey,
    provider: body.provider || "xai",
    model: body.model,
    baseUrl: body.baseUrl,
  });

  try {
    const { plan, source } = await buildForgePlan({
      prompt,
      answers: [],
      secrets,
    });

    const competitors = secrets
      ? await researchCompetitors({ prompt, brandName: plan.brandName, secrets })
      : [];

    return NextResponse.json({
      plan: { ...plan, competitors },
      source,
    });
  } catch (e) {
    console.error("[api/builder-v2/plan]", e);
    return NextResponse.json(
      { error: "Could not research this idea. Try again or add more detail." },
      { status: 500 }
    );
  }
}
