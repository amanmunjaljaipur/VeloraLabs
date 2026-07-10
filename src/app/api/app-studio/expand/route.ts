import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { expandAndBuildAppSpec } from "@/lib/app-studio/build-app-spec";
import { researchStudioIdea } from "@/lib/app-studio/generate";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import type { StudioResearchPack } from "@/lib/app-studio/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Step 1: research + rewrite prompt into full multi-role app spec.
 * Always returns a working appSpec (LLM when available, domain heuristics otherwise).
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    apiKey?: string;
    provider?: LlmProviderKind | "anthropic" | "openai" | "gemini";
    model?: string;
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
    ? body.provider === "gemini"
      ? {
          provider: "custom" as const,
          apiKey: body.apiKey.trim(),
          model: body.model || "gemini-2.0-flash",
          baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        }
      : {
          provider: (body.provider as LlmProviderKind) || ("groq" as const),
          apiKey: body.apiKey.trim(),
          model: body.model || "llama-3.3-70b-versatile",
        }
    : null;

  let research: StudioResearchPack | null = null;
  try {
    research = await researchStudioIdea({ prompt, secrets });
  } catch (e) {
    console.warn("[app-studio/expand] research failed, continuing with expand", e);
  }

  try {
    const { appSpec, research: enriched } = await expandAndBuildAppSpec({
      prompt,
      research,
      secrets,
    });

    return NextResponse.json({
      research: enriched,
      appSpec,
      rewrittenPrompt: appSpec.rewrittenPrompt,
    });
  } catch (e) {
    console.error("[app-studio/expand]", e);
    // Last resort: expand with no LLM still has heuristics
    try {
      const { appSpec, research: enriched } = await expandAndBuildAppSpec({
        prompt,
        research,
        secrets: null,
      });
      return NextResponse.json({
        research: enriched,
        appSpec,
        rewrittenPrompt: appSpec.rewrittenPrompt,
      });
    } catch (e2) {
      return NextResponse.json(
        {
          error: e2 instanceof Error ? e2.message.slice(0, 200) : "Expand failed",
        },
        { status: 500 }
      );
    }
  }
}
