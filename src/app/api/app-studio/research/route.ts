import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { researchStudioIdea } from "@/lib/app-studio/generate";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Research product workflows / competitors before build & publish. */
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
    return NextResponse.json({ error: "Describe what you want to build" }, { status: 400 });
  }

  const secrets = body.apiKey?.trim()
    ? body.provider === "gemini"
      ? {
          provider: "custom" as const,
          apiKey: body.apiKey.trim(),
          model: body.model || "gemini-2.0-flash",
          baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        }
      : body.provider === "anthropic"
        ? {
            provider: "custom" as const,
            apiKey: body.apiKey.trim(),
            model: body.model || "claude-sonnet-4-20250514",
            baseUrl: "https://api.anthropic.com/v1",
          }
        : {
            provider: (body.provider as LlmProviderKind) || ("groq" as const),
            apiKey: body.apiKey.trim(),
            model: body.model || "llama-3.3-70b-versatile",
          }
    : null;

  const research = await researchStudioIdea({ prompt, secrets });
  return NextResponse.json({ research });
}
