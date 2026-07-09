import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { APP_EXTENSIONS, getExtension, slugifyAppName } from "@/lib/app-builder/extensions";
import { defaultModelForProvider } from "@/lib/app-builder/llm";
import {
  listAppProjects,
  saveAppProject,
  uniqueAppSlug,
} from "@/lib/app-builder/store";
import type { AppInterviewAnswer, AppProject, LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    projects: listAppProjects(),
    extensions: APP_EXTENSIONS,
    llmProviders: [
      {
        id: "xai" as const,
        label: "xAI Grok",
        defaultModel: defaultModelForProvider("xai"),
        baseUrl: "https://api.x.ai/v1",
        hint: "Get a key at console.x.ai — use Grok to generate app content",
      },
      {
        id: "groq" as const,
        label: "Groq (free tier)",
        defaultModel: defaultModelForProvider("groq"),
        baseUrl: "https://api.groq.com/openai/v1",
        hint: "console.groq.com — fast free Llama models",
      },
      {
        id: "custom" as const,
        label: "Custom OpenAI-compatible",
        defaultModel: "gpt-4o-mini",
        baseUrl: "",
        hint: "Any OpenAI-compatible API (OpenRouter, Together, Azure, self-hosted…)",
      },
    ],
  });
}

export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    extensionId?: string;
    answers?: AppInterviewAnswer[];
    llm?: {
      provider: LlmProviderKind;
      model: string;
      baseUrl?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const extensionId = body.extensionId || "ecom-local-shop";
  const ext = getExtension(extensionId);
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  if (!ext) return NextResponse.json({ error: "Unknown extension" }, { status: 400 });

  const answers = Array.isArray(body.answers) ? body.answers : [];
  for (const q of ext.questions.filter((x) => x.required)) {
    const a = answers.find((x) => x.id === q.id)?.answer?.trim();
    if (!a) {
      return NextResponse.json({ error: `Missing answer: ${q.label}` }, { status: 400 });
    }
  }

  const brand =
    answers.find((a) => a.id === "brandName")?.answer?.trim() ||
    slugifyAppName(prompt).replace(/-/g, " ") ||
    "My App";
  const slug = uniqueAppSlug(brand);
  const now = new Date().toISOString();
  const provider = body.llm?.provider || "xai";

  const project: AppProject = {
    id: `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    name: brand,
    prompt,
    extensionId: ext.id,
    status: "draft",
    answers,
    llm: {
      provider,
      model: body.llm?.model || defaultModelForProvider(provider),
      baseUrl: body.llm?.baseUrl,
    },
    content: null,
    publicPath: `${ext.pathPrefix}/${slug}`,
    createdAt: now,
    updatedAt: now,
    createdBy: session.user?.email ?? undefined,
  };

  saveAppProject(project);
  return NextResponse.json({ project }, { status: 201 });
}
