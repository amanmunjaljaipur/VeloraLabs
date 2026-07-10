/**
 * Persist App Studio builds as hosted multi-tenant apps at /apps/{slug}.
 */

import { saveAppProject, uniqueAppSlug } from "@/lib/app-builder/store";
import { ensureTenantForProject } from "@/lib/app-builder/tenant-store";
import type { AppProject, GenericAppContent } from "@/lib/app-builder/types";
import type { StudioAppSpec, StudioFileMap, StudioResearchPack } from "@/lib/app-studio/types";
import { researchToVerlinContent } from "@/lib/app-studio/to-verlin-content";

export async function publishStudioApp(input: {
  prompt: string;
  research: StudioResearchPack;
  content?: GenericAppContent | null;
  studioFiles?: StudioFileMap | null;
  appSpec?: StudioAppSpec | null;
  brandName?: string;
  createdBy?: string;
  projectId?: string;
  slug?: string;
  status?: "draft" | "live";
}): Promise<{ project: AppProject; publicUrl: string }> {
  const content =
    input.content ||
    researchToVerlinContent({
      prompt: input.prompt,
      research: input.research,
      brandName: input.brandName || input.appSpec?.brandName,
    });

  const now = new Date().toISOString();
  const name =
    input.appSpec?.brandName || content.brandName || input.brandName || "Studio App";
  const slug = input.slug || (await uniqueAppSlug(name));
  const id =
    input.projectId ||
    `studio_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const status = input.status || "live";

  const project: AppProject = {
    id,
    slug,
    name,
    prompt: input.prompt,
    extensionId: "generic-app",
    status,
    answers: [
      {
        id: "source",
        question: "Built with",
        answer: "App Studio",
      },
      {
        id: "researchSummary",
        question: "Research summary",
        answer: input.research.summary,
      },
      {
        id: "rewrittenPrompt",
        question: "Expanded brief",
        answer: input.appSpec?.rewrittenPrompt || input.research.rewrittenPrompt || "",
      },
    ],
    customPoints: [
      `App Studio publish`,
      ...(input.appSpec?.roles || []).map((r) => `Role: ${r.label} — ${r.description}`),
      ...(input.appSpec?.workflows || []).map(
        (w) => `Workflow: ${w.name} — ${w.steps.join(" → ")}`
      ),
      ...(input.research.competitors || []).map(
        (c) => `Competitor: ${c.name} — ${c.takeaway}`
      ),
    ],
    llm: {
      provider: "xai",
      model: "app-studio",
    },
    content: {
      ...content,
      brandName: name,
      extensionId: "generic-app",
    },
    runtimeStyle: input.appSpec ? "studio-interactive" : "verlin-native",
    studioFiles: input.studioFiles || undefined,
    studioAppSpec: input.appSpec || undefined,
    publicPath: `/apps/${slug}`,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    generatedBy: "app-studio",
  };

  await saveAppProject(project);
  if (status === "live") {
    try {
      await ensureTenantForProject(project);
    } catch (e) {
      console.warn("[app-studio/publish] tenant init", e);
    }
  }

  return {
    project,
    publicUrl: project.publicPath,
  };
}
