import { assertAgentActive } from "@/lib/agents/controls";
import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateExtensionContent } from "@/lib/app-builder/generate";
import { packageAppProject } from "@/lib/app-builder/packager";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import { saveAppProject, uniqueAppSlug } from "@/lib/app-builder/store";
import { ensureTenantForProject } from "@/lib/app-builder/tenant-store";
import type { AppProject, LlmProviderKind } from "@/lib/app-builder/types";
import {
  forgeAnswersToInterview,
  forgePlanToProductPlan,
  type DiscoveryAnswer,
  type ForgeBuildPlan,
} from "@/lib/forge/types";
import { validateForgePlan } from "@/lib/forge/plan-edit";
import { isSuperAdminRole } from "@/lib/session-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Build a live product from an approved Forge plan.
 * Creates App Builder project + generates content + publishes.
 */
export async function POST(request: Request) {
  const paused = await assertAgentActive("app-builder-generate");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    plan?: ForgeBuildPlan;
    answers?: DiscoveryAnswer[];
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
  const plan = body.plan;
  if (!prompt || !plan) {
    return NextResponse.json({ error: "prompt and plan are required" }, { status: 400 });
  }

  const validity = validateForgePlan(plan);
  if (!validity.valid) {
    return NextResponse.json(
      { error: "Plan is not ready to build", details: validity.errors },
      { status: 400 }
    );
  }

  const isSuper = isSuperAdminRole(session.user?.role);
  const secrets = isSuper
    ? resolveAppBuilderSecrets({
        apiKey: body.apiKey,
        provider: body.provider || "xai",
        model: body.model,
        baseUrl: body.baseUrl,
      })
    : body.apiKey?.trim()
      ? resolveAppBuilderSecrets({
          apiKey: body.apiKey,
          provider: body.provider || "xai",
          model: body.model,
          baseUrl: body.baseUrl,
        })
      : null;

  if (!secrets) {
    return NextResponse.json(
      {
        error: isSuper
          ? "Platform Grok key is not configured. Set XAI_API_KEY on the server."
          : "Paste your AI helper key to build. Platform key is for Super Admin only.",
      },
      { status: 400 }
    );
  }

  const productPlan = forgePlanToProductPlan(plan);
  const answers = forgeAnswersToInterview(body.answers || []);
  const now = new Date().toISOString();
  const slug = await uniqueAppSlug(plan.brandName || "forge-app");
  const projectId = `forge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const project: AppProject = {
    id: projectId,
    slug,
    name: plan.brandName,
    prompt,
    extensionId: (plan.extensionId as AppProject["extensionId"]) || "generic-app",
    status: "draft",
    answers,
    customPoints: [
      `Forge plan: ${plan.archetype} / ${plan.domain}`,
      ...plan.assumptions.filter((a) => a.fromDefault).map((a) => `Default: ${a.text}`),
    ],
    llm: {
      provider: secrets.provider,
      model: secrets.model,
      baseUrl: secrets.baseUrl,
    },
    content: null,
    publicPath: `/apps/${slug}`,
    createdAt: now,
    updatedAt: now,
    createdBy: session.user?.email || undefined,
  };

  try {
    await saveAppProject(project);

    const { content, generatedBy } = await generateExtensionContent({
      extensionId: project.extensionId,
      prompt: project.prompt,
      answers: project.answers,
      customPoints: project.customPoints,
      secrets,
      productPlan,
    });

    const live: AppProject = {
      ...project,
      content,
      generatedBy,
      name: content.brandName || project.name,
      status: "live",
      updatedAt: new Date().toISOString(),
    };

    await saveAppProject(live);
    await ensureTenantForProject(live);
    try {
      await packageAppProject(live);
    } catch (packErr) {
      console.warn("[forge/build] package warning", packErr);
    }

    return NextResponse.json({
      project: live,
      publicUrl: live.publicPath,
      buildSteps: [
        { id: "roles", label: "User roles & auth", status: "done" },
        { id: "data", label: "Data models & seed data", status: "done" },
        { id: "features", label: "Features & modules", status: "done" },
        { id: "screens", label: "Screens & UI", status: "done" },
        { id: "publish", label: "Publish live link", status: "done" },
      ],
    });
  } catch (e) {
    console.error("[forge/build]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message.slice(0, 200)
            : "Build failed. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
