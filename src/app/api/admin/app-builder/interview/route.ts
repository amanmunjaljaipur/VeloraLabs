import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { designInterviewQuestions } from "@/lib/app-builder/interview-questions";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Product-manager interview design from one product prompt.
 * Uses caller's Grok/Groq key if provided; else platform XAI_API_KEY / GROQ_API_KEY.
 * Keys are never stored.
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    extensionId?: string;
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
      { error: "Please describe your product idea first (simple words are fine)." },
      { status: 400 }
    );
  }

  const secrets = body.apiKey?.trim()
    ? {
        provider: body.provider || ("xai" as const),
        apiKey: body.apiKey.trim(),
        model: body.model || "",
        baseUrl: body.baseUrl,
      }
    : null;

  const result = await designInterviewQuestions({
    prompt,
    extensionId: body.extensionId || "ecom-local-shop",
    secrets,
  });

  return NextResponse.json({
    questions: result.questions,
    designedBy: result.designedBy,
    rationale: result.rationale,
    note: body.apiKey?.trim()
      ? "Questions designed with your AI key (not stored)."
      : result.designedBy.startsWith("fallback")
        ? "Starter questions from your idea. Add a Grok key on the next AI step for richer generation — or set XAI_API_KEY on the server for full PM design."
        : "Questions designed by the product-manager AI from your idea.",
  });
}
