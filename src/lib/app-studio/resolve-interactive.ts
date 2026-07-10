/**
 * Turn any published App Studio / App Builder shell into an interactive multi-role app.
 * Fixes old Blob projects that only have marketing content (ResumeLift, Verlin Bank, etc.).
 */

import type { AppProject } from "@/lib/app-builder/types";
import { saveAppProject } from "@/lib/app-builder/store";
import { buildHeuristicAppSpec } from "@/lib/app-studio/build-app-spec";
import type { StudioAppSpec } from "@/lib/app-studio/types";

/**
 * Ecom shops keep shop runtime.
 * Every other live app (banking, resume, booking, studio, insurance…) is interactive.
 */
export function shouldUseInteractiveRuntime(project: AppProject): boolean {
  if (project.extensionId === "ecom-local-shop") return false;
  return true;
}

function promptFromProject(project: AppProject): string {
  const brand =
    project.studioAppSpec?.brandName ||
    (project.content && "brandName" in project.content
      ? String((project.content as { brandName?: string }).brandName || "")
      : "") ||
    project.name;
  const contentBits: string[] = [];
  if (project.content && typeof project.content === "object") {
    const c = project.content as unknown as {
      tagline?: string;
      description?: string;
      businessModel?: string;
    };
    if (typeof c.tagline === "string") contentBits.push(c.tagline);
    if (typeof c.description === "string") contentBits.push(c.description);
    if (typeof c.businessModel === "string") contentBits.push(c.businessModel);
  }
  const bits = [
    project.prompt,
    brand,
    project.name,
    project.slug,
    project.extensionId,
    ...contentBits,
    ...(project.customPoints || []),
    ...(project.answers || []).map((a) => `${a.question}: ${a.answer}`),
  ].filter(Boolean);
  return bits.join("\n");
}

/** Spec is "real" only if it has multi-role workflows, not a stub. */
function isStrongSpec(spec: StudioAppSpec | undefined | null): boolean {
  if (!spec?.roles?.length || !spec.screens?.length || !spec.entities?.length) return false;
  if (spec.roles.length < 2) return false;
  if (!spec.workflows?.length) return false;
  return true;
}

/**
 * Return interactive appSpec — existing strong one or freshly built from project.
 * Persists upgrade so Blob stays corrected (best-effort).
 */
export async function resolveInteractiveAppSpec(
  project: AppProject
): Promise<{ spec: StudioAppSpec; project: AppProject }> {
  // Keep strong specs that already declare a specialized productKind
  if (
    isStrongSpec(project.studioAppSpec) &&
    project.studioAppSpec!.productKind &&
    project.studioAppSpec!.productKind !== "generic"
  ) {
    return { spec: project.studioAppSpec!, project };
  }
  // Rebuild weak/generic shells so resume/banking get real product UIs + rich seed

  const prompt = promptFromProject(project);
  const spec = buildHeuristicAppSpec(prompt, null, {
    extensionId: project.extensionId,
    slug: project.slug,
    name: project.name,
  });

  if (project.name) {
    spec.brandName = project.name;
  }
  if (project.content && "tagline" in project.content && project.content.tagline) {
    spec.tagline = String(project.content.tagline);
  }
  if (project.content && "description" in project.content && project.content.description) {
    // Keep operational description from heuristic if content is pure marketing fluff
    const desc = String(project.content.description);
    if (desc.length < 80 || /marketing|website|highlights/i.test(desc)) {
      // keep heuristic description
    } else {
      spec.description = desc.slice(0, 400);
    }
  }

  const upgraded: AppProject = {
    ...project,
    studioAppSpec: spec,
    runtimeStyle: "studio-interactive",
    updatedAt: new Date().toISOString(),
    // Help future detects
    customPoints: [
      ...(project.customPoints || []).filter((p) => !p.startsWith("Interactive upgrade:")),
      `Interactive upgrade: ${spec.roles.map((r) => r.label).join(", ")} · ${spec.workflows.length} workflows`,
    ],
  };

  try {
    await saveAppProject(upgraded);
  } catch (e) {
    console.warn("[resolve-interactive] persist failed (still rendering live)", e);
  }

  return { spec, project: upgraded };
}
