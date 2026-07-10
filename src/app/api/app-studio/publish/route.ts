import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { expandAndBuildAppSpec } from "@/lib/app-studio/build-app-spec";
import { researchStudioIdea } from "@/lib/app-studio/generate";
import { publishStudioApp } from "@/lib/app-studio/publish";
import { researchToVerlinContent } from "@/lib/app-studio/to-verlin-content";
import type { StudioAppSpec, StudioFileMap, StudioResearchPack } from "@/lib/app-studio/types";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Publish interactive multi-role app at /apps/{slug}.
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    research?: StudioResearchPack | null;
    appSpec?: StudioAppSpec | null;
    studioFiles?: StudioFileMap | null;
    brandName?: string;
    status?: "draft" | "live";
    projectId?: string;
    slug?: string;
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

  let research = body.research || null;
  let appSpec = body.appSpec || null;

  if (!appSpec || !appSpec.roles?.length) {
    if (!research?.summary) {
      research = await researchStudioIdea({ prompt, secrets });
    }
    const expanded = await expandAndBuildAppSpec({ prompt, research, secrets });
    appSpec = expanded.appSpec;
    research = expanded.research;
  }

  if (!research) {
    research = {
      summary: appSpec.description,
      targetUsers: appSpec.roles.map((r) => r.label),
      coreWorkflows: appSpec.workflows.map((w) => ({ name: w.name, steps: w.steps })),
      screens: appSpec.screens.map((s) => s.title),
      dataEntities: appSpec.entities.map((e) => e.name),
      techNotes: [],
      competitors: [],
      rewrittenPrompt: appSpec.rewrittenPrompt,
    };
  }

  const content = researchToVerlinContent({
    prompt,
    research,
    brandName: body.brandName || appSpec.brandName,
  });

  try {
    const { project, publicUrl } = await publishStudioApp({
      prompt,
      research,
      content,
      appSpec,
      studioFiles: body.studioFiles || null,
      brandName: appSpec.brandName,
      createdBy: session.user?.email || undefined,
      projectId: body.projectId,
      slug: body.slug,
      status: body.status || "live",
    });

    const origin =
      process.env.AUTH_URL?.replace(/\/$/, "") ||
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      "https://www.verlinlabs.com";

    return NextResponse.json({
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        status: project.status,
        publicPath: project.publicPath,
      },
      publicUrl,
      absoluteUrl: `${origin}${publicUrl}`,
      research,
      appSpec,
      content,
    });
  } catch (e) {
    console.error("[app-studio/publish]", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message.slice(0, 200) : "Publish failed",
      },
      { status: 500 }
    );
  }
}
