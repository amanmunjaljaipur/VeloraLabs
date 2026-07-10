import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateExtensionContent } from "@/lib/app-builder/generate";
import { packageAppProject } from "@/lib/app-builder/packager";
import { getAppProject, saveAppProject } from "@/lib/app-builder/store";
import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Generate + publish app content using the caller's LLM API key.
 * Secrets are request-only and never stored.
 * Awaits Blob persist so the public /apps/{slug} page works on any server instance.
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    projectId?: string;
    apiKey?: string;
    provider?: LlmProviderKind;
    model?: string;
    baseUrl?: string;
    publish?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!body.apiKey?.trim()) {
    return NextResponse.json(
      {
        error:
          "Please paste your AI helper key (from Grok, Groq, or your own AI). We use it once and never save it.",
      },
      { status: 400 }
    );
  }

  const project = await getAppProject(body.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const secrets: AppLlmSecrets = {
    provider: body.provider || project.llm.provider || "xai",
    apiKey: body.apiKey.trim(),
    model: body.model || project.llm.model,
    baseUrl: body.baseUrl || project.llm.baseUrl,
  };

  try {
    const { content, generatedBy } = await generateExtensionContent({
      extensionId: project.extensionId,
      prompt: project.prompt,
      answers: project.answers,
      customPoints: project.customPoints,
      secrets,
    });

    const now = new Date().toISOString();
    const next = {
      ...project,
      content,
      generatedBy,
      name: content.brandName || project.name,
      status: (body.publish === false ? "draft" : "live") as "draft" | "live",
      llm: {
        provider: secrets.provider,
        model: secrets.model,
        baseUrl: secrets.baseUrl,
      },
      updatedAt: now,
    };

    await saveAppProject(next);

    let packageInfo: { folderPath: string; files: string[] } | null = null;
    if (next.status === "live" && next.content) {
      try {
        packageInfo = await packageAppProject(next);
      } catch (packErr) {
        console.error("[app-builder] package failed (app still live):", packErr);
      }
    }

    return NextResponse.json({
      project: next,
      publicUrl: next.publicPath,
      packageFolder: packageInfo
        ? `generated-apps/${next.slug}`
        : undefined,
      packageFiles: packageInfo?.files,
      note: "API key was used for this request only and was not stored. Shop data is saved permanently.",
    });
  } catch (error) {
    console.error("[app-builder/generate]", error);
    const message = error instanceof Error ? error.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
