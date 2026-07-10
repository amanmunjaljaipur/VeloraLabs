import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  generateStudioApp,
  researchStudioIdea,
  StudioLlmError,
} from "@/lib/app-studio/generate";
import type { StudioFileMap, StudioResearchPack } from "@/lib/app-studio/types";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function secretsFromBody(body: {
  apiKey?: string;
  provider?: LlmProviderKind | "anthropic" | "openai" | "gemini";
  model?: string;
}) {
  if (!body.apiKey?.trim()) return null;
  const key = body.apiKey.trim();
  if (body.provider === "anthropic") {
    return {
      provider: "custom" as const,
      apiKey: key,
      model: body.model || "claude-sonnet-4-20250514",
      baseUrl: "https://api.anthropic.com/v1",
    };
  }
  if (body.provider === "openai") {
    return {
      provider: "custom" as const,
      apiKey: key,
      model: body.model || "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1",
    };
  }
  if (body.provider === "gemini") {
    return {
      provider: "custom" as const,
      apiKey: key,
      model: body.model || "gemini-2.0-flash",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    };
  }
  return {
    provider: (body.provider as LlmProviderKind) || ("groq" as const),
    apiKey: key,
    model:
      body.model ||
      (body.provider === "xai" ? "grok-3-mini" : "llama-3.3-70b-versatile"),
  };
}

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
    provider?: LlmProviderKind | "anthropic" | "openai" | "gemini";
    model?: string;
    /** Prefer real AI; only fall back to template if explicitly allowed */
    allowTemplateFallback?: boolean;
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

  const secrets = secretsFromBody(body);
  const allowTemplate = body.allowTemplateFallback === true;

  let research = body.research || null;
  if (body.runResearch !== false && !research) {
    research = await researchStudioIdea({ prompt, secrets });
  }

  const imageDescription = body.imageDataUrl
    ? "User attached a UI reference image. Match layout, colors, and hierarchy as closely as possible."
    : null;

  try {
    const result = await generateStudioApp({
      prompt,
      history: body.history,
      currentFiles: body.currentFiles || null,
      research,
      imageDescription,
      secrets,
      strict: !allowTemplate,
    });

    // Always return files when present so the UI can render Sandpack
    if (result.files && Object.keys(result.files).length > 0) {
      return NextResponse.json({
        files: result.files,
        summary: result.summary,
        research: result.research || research,
        designedBy: result.designedBy,
        warning: result.errorCode ? result.summary : undefined,
      });
    }

    if (result.errorCode) {
      return NextResponse.json(
        {
          error: result.summary,
          code: result.errorCode,
          research: result.research || research,
          designedBy: result.designedBy,
        },
        {
          status:
            result.errorCode === "credits" ||
            result.errorCode === "auth" ||
            result.errorCode === "no_key"
              ? 402
              : 502,
        }
      );
    }

    return NextResponse.json({
      files: result.files,
      summary: result.summary,
      research: result.research || research,
      designedBy: result.designedBy,
    });
  } catch (e) {
    const fe =
      e instanceof StudioLlmError
        ? e
        : new StudioLlmError("upstream", e instanceof Error ? e.message : "Generation failed");

    // Always soft-return a starter so preview is not blank
    const soft = await generateStudioApp({
      prompt,
      currentFiles: body.currentFiles || null,
      research,
      secrets: null,
      strict: false,
    });
    return NextResponse.json({
      files: soft.files,
      summary: `${fe.message} Showing starter template.`,
      research: research || soft.research,
      designedBy: "error-fallback",
      code: fe.code,
      warning: fe.message,
    });
  }
}
