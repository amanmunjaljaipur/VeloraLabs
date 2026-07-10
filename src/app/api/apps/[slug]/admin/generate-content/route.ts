import { requireAppCapability } from "@/lib/app-builder/app-auth";
import {
  applyContentPack,
  runContentAgent,
  type ContentAgentScope,
} from "@/lib/app-builder/content-agent";
import { getAppProjectBySlug, saveAppProject } from "@/lib/app-builder/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

const SCOPES = new Set<ContentAgentScope>(["all", "home", "about", "faq", "seo", "products"]);

/**
 * App Content Agent: improve shop wording (SEO, premium local copy).
 * Body: { scope?: "all"|"home"|"about"|"faq"|"seo"|"products", instruction?: string, apply?: boolean }
 */
export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "products.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await getAppProjectBySlug(slug);
  if (!project?.content || project.content.extensionId !== "ecom-local-shop") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    scope?: string;
    instruction?: string;
    apply?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const scope = (SCOPES.has(body.scope as ContentAgentScope)
    ? body.scope
    : "all") as ContentAgentScope;

  const { pack, source } = await runContentAgent({
    content: project.content,
    answers: project.answers || [],
    scope,
    customInstruction: body.instruction?.slice(0, 500),
  });

  const apply = body.apply !== false;
  if (!apply) {
    return NextResponse.json({ pack, source, applied: false });
  }

  const content = applyContentPack(project.content, pack);
  const next = {
    ...project,
    content,
    updatedAt: new Date().toISOString(),
  };
  await saveAppProject(next);

  return NextResponse.json({
    content,
    pack,
    source,
    applied: true,
    message:
      source === "llm"
        ? "Wording improved — check Home, About, and FAQ"
        : "Wording filled from your shop details (offline mode)",
  });
}
