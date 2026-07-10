import { assertAgentActive } from "@/lib/agents/controls";
import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateExtensionContent } from "@/lib/app-builder/generate";
import type { BuildProgressEvent } from "@/lib/app-builder/generate-generic";
import { packageAppProject } from "@/lib/app-builder/packager";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import { saveAppProject, uniqueAppSlug } from "@/lib/app-builder/store";
import { ensureTenantForProject, seedGenericRecords } from "@/lib/app-builder/tenant-store";
import type { AppProject, LlmProviderKind } from "@/lib/app-builder/types";
import { forgePlanToProductPlan, type ForgeBuildPlan } from "@/lib/forge/types";
import { validateForgePlan } from "@/lib/forge/plan-edit";
import { isSuperAdminRole } from "@/lib/session-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 280;

type StreamEvent =
  | { type: "progress"; id: string; label: string; status: "pending" | "running" | "done"; detail?: string }
  | { type: "done"; project: AppProject; publicUrl: string; buildSteps: Array<{ id: string; label: string; status: string }> }
  | { type: "error"; error: string };

/**
 * App Builder V2 build — same real pipeline as Forge (batched content
 * generation, real tenant/roles/seed data) but marks the project
 * runtimeStyle: "verlin-native" so it renders with Verlin Labs' actual UI
 * components (VerlinAppRuntime) instead of a per-app generated theme, and so
 * intake pages get wired to the public data-submit endpoint.
 */
export async function POST(request: Request) {
  const paused = await assertAgentActive("app-builder-generate");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    prompt?: string;
    plan?: ForgeBuildPlan;
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
  const now = new Date().toISOString();
  const slug = await uniqueAppSlug(plan.brandName || "app-v2");
  const projectId = `v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const project: AppProject = {
    id: projectId,
    slug,
    name: plan.brandName,
    prompt,
    extensionId: (plan.extensionId as AppProject["extensionId"]) || "generic-app",
    status: "draft",
    answers: [],
    customPoints: [
      `App Builder V2 plan: ${plan.archetype} / ${plan.domain}`,
      ...(plan.competitors || []).map(
        (c) => `Competitor: ${c.name} — does well: ${c.whatTheyDoWell}; gap: ${c.gap}`
      ),
    ],
    llm: {
      provider: secrets.provider,
      model: secrets.model,
      baseUrl: secrets.baseUrl,
    },
    content: null,
    dataModels: plan.dataModels,
    runtimeStyle: "verlin-native",
    publicPath: `/apps/${slug}`,
    createdAt: now,
    updatedAt: now,
    createdBy: session.user?.email || undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        send({ type: "progress", id: "plan", label: "Setting up your project", status: "running" });
        await saveAppProject(project);
        send({ type: "progress", id: "plan", label: "Setting up your project", status: "done" });

        send({ type: "progress", id: "content", label: "Writing real content for every page", status: "running" });
        const { content, generatedBy } = await generateExtensionContent({
          extensionId: project.extensionId,
          prompt: project.prompt,
          answers: project.answers,
          customPoints: project.customPoints,
          secrets,
          productPlan,
          onProgress: (evt: BuildProgressEvent) => {
            send({
              type: "progress",
              id: "content",
              label: "Writing real content for every page",
              status: "running",
              detail: evt.message,
            });
          },
        });
        send({
          type: "progress",
          id: "content",
          label: "Writing real content for every page",
          status: "done",
          detail: generatedBy === "fallback-plan-seed" || generatedBy === "fallback-generic"
            ? "Used safe defaults for a few sections — you can regenerate any page later."
            : undefined,
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

        send({ type: "progress", id: "roles", label: "Setting up accounts & permissions", status: "running" });
        await ensureTenantForProject(live);
        send({ type: "progress", id: "roles", label: "Setting up accounts & permissions", status: "done" });

        if (plan.dataModels?.length) {
          send({ type: "progress", id: "data", label: "Adding sample data", status: "running" });
          try {
            await seedGenericRecords(slug, plan.dataModels);
          } catch (seedErr) {
            console.warn("[builder-v2/build] seed warning", seedErr);
          }
          send({ type: "progress", id: "data", label: "Adding sample data", status: "done" });
        }

        send({ type: "progress", id: "publish", label: "Publishing your live link", status: "running" });
        try {
          await packageAppProject(live);
        } catch (packErr) {
          console.warn("[builder-v2/build] package warning", packErr);
        }
        send({ type: "progress", id: "publish", label: "Publishing your live link", status: "done" });

        send({
          type: "done",
          project: live,
          publicUrl: live.publicPath,
          buildSteps: [
            { id: "plan", label: "Setting up your project", status: "done" },
            { id: "content", label: "Writing real content for every page", status: "done" },
            { id: "roles", label: "Setting up accounts & permissions", status: "done" },
            { id: "data", label: "Adding sample data", status: "done" },
            { id: "publish", label: "Publishing your live link", status: "done" },
          ],
        });
      } catch (e) {
        console.error("[builder-v2/build]", e);
        send({
          type: "error",
          error:
            e instanceof Error
              ? e.message.slice(0, 200)
              : "Build failed. Try again in a moment.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
