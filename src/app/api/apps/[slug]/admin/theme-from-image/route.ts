import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { suggestThemeFromPalette } from "@/lib/app-builder/theme-from-image";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Given dominant colours sampled from a logo/theme image (client-side canvas),
 * return a shop theme: primary/secondary + logo gradient.
 */
export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { palette?: string[]; brandName?: string; city?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const palette = Array.isArray(body.palette)
    ? body.palette.filter((c): c is string => typeof c === "string").slice(0, 12)
    : [];
  if (palette.length === 0) {
    return NextResponse.json(
      { error: "Upload a logo or theme image first, then try again." },
      { status: 400 }
    );
  }

  const project = await getAppProjectBySlug(slug);
  const content = project?.content;
  const theme = await suggestThemeFromPalette({
    palette,
    brandName: body.brandName || content?.brandName,
    city: body.city || content?.city,
  });

  return NextResponse.json({ theme });
}
