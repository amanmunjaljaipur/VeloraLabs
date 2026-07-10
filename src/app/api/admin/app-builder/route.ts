import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  APP_EXTENSIONS,
  APP_IDEA_EXAMPLES,
  getExtension,
  slugifyAppName,
} from "@/lib/app-builder/extensions";
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

  const projects = await listAppProjects();

  return NextResponse.json({
    projects,
    extensions: APP_EXTENSIONS,
    ideaExamples: APP_IDEA_EXAMPLES,
    llmProviders: [
      {
        id: "xai" as const,
        label: "Grok (xAI)",
        plainLabel: "Grok — smart AI helper from xAI",
        defaultModel: defaultModelForProvider("xai"),
        baseUrl: "https://api.x.ai/v1",
        hint: "Paste the key you get from console.x.ai. We never save it.",
      },
      {
        id: "groq" as const,
        label: "Groq (often free)",
        plainLabel: "Groq — fast free-tier AI helper",
        defaultModel: defaultModelForProvider("groq"),
        baseUrl: "https://api.groq.com/openai/v1",
        hint: "Paste the key from console.groq.com. We never save it.",
      },
      {
        id: "custom" as const,
        label: "Your own AI",
        plainLabel: "Any other AI that uses an OpenAI-style link",
        defaultModel: "gpt-4o-mini",
        baseUrl: "",
        hint: "For advanced users: your own AI service URL + key.",
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
    customPoints?: string[];
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
  if (!prompt) {
    return NextResponse.json(
      { error: "Please describe your shop idea in simple words first." },
      { status: 400 }
    );
  }
  if (!ext) return NextResponse.json({ error: "Unknown shop type" }, { status: 400 });

  const answers = Array.isArray(body.answers) ? body.answers : [];
  for (const q of ext.questions.filter((x) => x.required)) {
    const a = answers.find((x) => x.id === q.id)?.answer?.trim();
    if (!a) {
      return NextResponse.json({ error: `Please answer: ${q.label}` }, { status: 400 });
    }
  }

  const customPoints = Array.isArray(body.customPoints)
    ? body.customPoints.map((p) => String(p).trim()).filter(Boolean).slice(0, 30)
    : [];

  const brand =
    answers.find((a) => a.id === "brandName")?.answer?.trim() ||
    slugifyAppName(prompt).replace(/-/g, " ") ||
    "My Shop";
  const slug = await uniqueAppSlug(brand);
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
    customPoints,
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

  await saveAppProject(project);
  return NextResponse.json({ project }, { status: 201 });
}
