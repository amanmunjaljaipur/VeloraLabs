import { assertAgentActive } from "@/lib/agents/controls";
import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateExtensionContent } from "@/lib/app-builder/generate";
import { packageAppProject } from "@/lib/app-builder/packager";
import { canAccessAppProject } from "@/lib/app-builder/project-access";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import { getAppProject, saveAppProject } from "@/lib/app-builder/store";
import { ensureTenantForProject } from "@/lib/app-builder/tenant-store";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { isSuperAdminRole } from "@/lib/session-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Generate + publish app content.
 * Super admin: uses platform XAI_API_KEY by default (no paste required).
 * Others: may paste their own key; platform key used as fallback when configured.
 * Keys from the request are never stored.
 */
export async function POST(request: Request) {
  const paused = await assertAgentActive("app-builder-generate");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    projectId?: string;
    apiKey?: string;
    provider?: LlmProviderKind;
    model?: string;
    baseUrl?: string;
    publish?: boolean;
    usePlatformKey?: boolean;
    productPlan?: import("@/lib/app-builder/product-plan-types").ProductPlan;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await getAppProject(body.projectId);
  if (!project || !canAccessAppProject(project, session)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isSuper = isSuperAdminRole(session.user?.role);
  // Non–super-admin must supply their own key (do not burn platform quota / cost DoS)
  const secrets = isSuper
    ? resolveAppBuilderSecrets({
        apiKey: body.apiKey,
        provider: body.provider || project.llm.provider || "xai",
        model: body.model || project.llm.model,
        baseUrl: body.baseUrl || project.llm.baseUrl,
      })
    : body.apiKey?.trim()
      ? resolveAppBuilderSecrets({
          apiKey: body.apiKey,
          provider: body.provider || project.llm.provider || "xai",
          model: body.model || project.llm.model,
          baseUrl: body.baseUrl || project.llm.baseUrl,
        })
      : null;

  if (!secrets) {
    return NextResponse.json(
      {
        error: isSuper
          ? "Platform Grok key is not configured. Set XAI_API_KEY on the server."
          : "Please paste your AI helper key (Grok / Groq / custom). Platform key is only for Super Admin.",
      },
      { status: 400 }
    );
  }

  try {
    const { content, generatedBy } = await generateExtensionContent({
      extensionId: project.extensionId,
      prompt: project.prompt,
      answers: project.answers,
      customPoints: project.customPoints,
      secrets,
      productPlan: body.productPlan || null,
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

    // Separate app tenancy: creator = Owner, new public sign-ups = Customer
    try {
      await ensureTenantForProject(next);
    } catch (tenantErr) {
      console.error("[app-builder] tenant init failed:", tenantErr);
    }

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
      note: "API key was used for this request only and was not stored. Shop has its own login at /apps/{slug}/login.",
    });
  } catch (error) {
    console.error("[app-builder/generate]", error);
    const message = error instanceof Error ? error.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
