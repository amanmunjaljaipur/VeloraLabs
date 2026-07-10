import { assertAgentActive } from "@/lib/agents/controls";
import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { findProductImageOptions } from "@/lib/app-builder/product-images";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Search the internet (Wikimedia) + build custom product images for a product name.
 * Owner picks one in the admin Products UI.
 */
export async function POST(request: Request, context: Ctx) {
  const paused = await assertAgentActive("app-theme");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "products.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    name?: string;
    description?: string;
    category?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Enter a product name first, then we can find images." },
      { status: 400 }
    );
  }

  const project = await getAppProjectBySlug(slug);
  const brandName = project?.content?.brandName || authz.tenant.brandName;
  const city = project?.content?.city || "";

  const options = await findProductImageOptions({
    name,
    description: body.description,
    category: body.category,
    brandName,
    city,
  });

  return NextResponse.json({
    options,
    note: "Pick a custom photo or a web search photo for this product.",
  });
}
