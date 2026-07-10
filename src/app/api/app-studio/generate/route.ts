import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateStudioApp, researchStudioIdea } from "@/lib/app-studio/generate";
import type { StudioFileMap, StudioResearchPack } from "@/lib/app-studio/types";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * App Studio generate / iterate.
 * 1) Optional research (workflows + competitors)
 * 2) Full app or file diffs from LLM
 * Keys are request-scoped or from server env — never stored.
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    currentFiles?: StudioFileMap;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    research?: StudioResearchPack | null;
    runResearch?: boolean;
    imageDataUrl?: string;
    apiKey?: string;
    provider?: LlmProviderKind | "anthropic";
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
    ? body.provider === "anthropic"
      ? {
          provider: "custom" as const,
          apiKey: body.apiKey.trim(),
          model: body.model || "claude-sonnet-4-20250514",
          baseUrl: "https://api.anthropic.com/v1",
        }
      : {
          provider: (body.provider as LlmProviderKind) || ("xai" as const),
          apiKey: body.apiKey.trim(),
          model: body.model || "grok-3-mini",
        }
    : null;

  let research = body.research || null;
  if (body.runResearch !== false && !research) {
    research = await researchStudioIdea({ prompt, secrets });
  }

  const imageDescription = body.imageDataUrl
    ? "User attached a UI reference image. Match layout, colors, and hierarchy as closely as possible."
    : null;

  const result = await generateStudioApp({
    prompt,
    history: body.history,
    currentFiles: body.currentFiles || null,
    research,
    imageDescription,
    secrets,
  });

  return NextResponse.json({
    files: result.files,
    summary: result.summary,
    research: result.research || research,
    designedBy: result.designedBy,
  });
}
