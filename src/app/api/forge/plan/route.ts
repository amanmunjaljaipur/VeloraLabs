import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { buildForgePlan } from "@/lib/forge/plan";
import type { DiscoveryAnswer } from "@/lib/forge/types";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

/** Generate full Forge build plan from prompt + discovery answers */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    answers?: DiscoveryAnswer[];
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
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const secrets = body.apiKey?.trim()
    ? {
        provider: body.provider || ("xai" as const),
        apiKey: body.apiKey.trim(),
        model: body.model || "grok-3-mini",
        baseUrl: body.baseUrl,
      }
    : null;

  try {
    const { plan, source } = await buildForgePlan({
      prompt,
      answers: body.answers || [],
      customPoints: body.customPoints,
      secrets,
    });
    return NextResponse.json({ plan, source });
  } catch (e) {
    console.error("[api/forge/plan]", e);
    return NextResponse.json(
      { error: "Could not generate plan. Try again." },
      { status: 500 }
    );
  }
}
