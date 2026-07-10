import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  applyPlanEdit,
  regeneratePlanSection,
  type PlanSectionKey,
} from "@/lib/forge/plan-edit";
import type { ForgeBuildPlan } from "@/lib/forge/types";
import type { LlmProviderKind } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Natural-language plan edit or single-section regenerate */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    plan?: ForgeBuildPlan;
    instruction?: string;
    action?: "edit" | "regenerate";
    section?: PlanSectionKey;
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

  if (!body.plan) {
    return NextResponse.json({ error: "plan is required" }, { status: 400 });
  }

  const secrets = body.apiKey?.trim()
    ? {
        provider: body.provider || ("xai" as const),
        apiKey: body.apiKey.trim(),
        model: body.model || "grok-3-mini",
        baseUrl: body.baseUrl,
      }
    : null;

  if (body.action === "regenerate" && body.section) {
    const result = await regeneratePlanSection({
      plan: body.plan,
      section: body.section,
      secrets,
    });
    return NextResponse.json(result);
  }

  if (!body.instruction?.trim()) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  const result = await applyPlanEdit({
    plan: body.plan,
    instruction: body.instruction,
    secrets,
  });
  return NextResponse.json(result);
}
