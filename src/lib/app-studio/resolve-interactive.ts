/**
 * Turn any published App Studio / generic shell into an interactive multi-role app.
 * Fixes old Blob projects that only have marketing Verlin content (e.g. ResumeLift).
 */

import type { AppProject } from "@/lib/app-builder/types";
import { saveAppProject } from "@/lib/app-builder/store";
import { buildHeuristicAppSpec } from "@/lib/app-studio/build-app-spec";
import type { StudioAppSpec } from "@/lib/app-studio/types";

/** Ecom shops keep their shop runtime — everything else becomes interactive. */
export function shouldUseInteractiveRuntime(project: AppProject): boolean {
  if (project.extensionId === "ecom-local-shop") return false;
  if (project.runtimeStyle === "studio-interactive") return true;
  if (project.studioAppSpec) return true;
  if (project.generatedBy === "app-studio") return true;
  // Old App Builder marketing shells for non-shop products
  if (
    project.extensionId === "generic-app" ||
    project.extensionId === "resume-career" ||
    project.extensionId === "booking-local" ||
    project.extensionId === "tuition-centre" ||
    project.extensionId === "portfolio" ||
    project.extensionId === "insurance" ||
    project.extensionId === "digital-banking"
  ) {
    return true;
  }
  return false;
}

function promptFromProject(project: AppProject): string {
  const brand =
    project.studioAppSpec?.brandName ||
    (project.content && "brandName" in project.content
      ? String((project.content as { brandName?: string }).brandName || "")
      : "") ||
    project.name;
  const bits = [
    project.prompt,
    brand,
    project.name,
    project.slug,
    project.extensionId,
    ...(project.customPoints || []),
    ...(project.answers || []).map((a) => `${a.question}: ${a.answer}`),
  ].filter(Boolean);
  return bits.join("\n");
}

/**
 * Return interactive appSpec — existing or freshly built from project prompt/brand.
 * Persists upgrade once so Blob stays corrected for next visit.
 */
export async function resolveInteractiveAppSpec(
  project: AppProject
): Promise<{ spec: StudioAppSpec; project: AppProject }> {
  if (project.studioAppSpec?.roles?.length && project.studioAppSpec.screens?.length) {
    return { spec: project.studioAppSpec, project };
  }

  const prompt = promptFromProject(project);
  const spec = buildHeuristicAppSpec(prompt);
  // Prefer stored brand name
  if (project.name && !/task|flowboard/i.test(spec.brandName)) {
    // keep heuristic brand
  }
  if (project.name) {
    spec.brandName = project.name;
  }
  if (project.content && "tagline" in project.content && project.content.tagline) {
    spec.tagline = String(project.content.tagline);
  }
  if (project.content && "description" in project.content && project.content.description) {
    spec.description = String(project.content.description).slice(0, 400);
  }

  const upgraded: AppProject = {
    ...project,
    studioAppSpec: spec,
    runtimeStyle: "studio-interactive",
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveAppProject(upgraded);
  } catch (e) {
    console.warn("[resolve-interactive] persist failed (still rendering live)", e);
  }

  return { spec, project: upgraded };
}
