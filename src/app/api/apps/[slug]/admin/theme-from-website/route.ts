import { assertAgentActive } from "@/lib/agents/controls";
import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { themeFromWebsiteUrl } from "@/lib/app-builder/theme-from-website";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Pull multi-colour theme (+ optional logo candidate) from owner's existing website.
 */
export async function POST(request: Request, context: Ctx) {
  const paused = await assertAgentActive("app-theme");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { websiteUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const websiteUrl = body.websiteUrl?.trim();
  if (!websiteUrl) {
    return NextResponse.json({ error: "Paste your website link first" }, { status: 400 });
  }

  const project = await getAppProjectBySlug(slug);
  try {
    const theme = await themeFromWebsiteUrl(websiteUrl, {
      brandName: project?.content?.brandName || authz.tenant.brandName,
      city: project?.content && "city" in project.content ? project.content.city : undefined,
    });
    return NextResponse.json({
      theme: {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        surfaceColor: theme.surfaceColor,
        themePalette: theme.themePalette,
        logoBgFrom: theme.logoBgFrom,
        logoBgTo: theme.logoBgTo,
        badge: theme.badge,
        notes: theme.notes,
      },
      logoCandidateUrl: theme.logoCandidateUrl,
      websiteUrl: theme.websiteUrl,
      sampledFrom: theme.sampledFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not read website theme";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
