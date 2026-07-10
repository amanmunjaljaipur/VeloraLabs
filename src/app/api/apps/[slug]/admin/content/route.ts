import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { ensureProductImages } from "@/lib/app-builder/product-images";
import { getAppProjectBySlug, saveAppProject } from "@/lib/app-builder/store";
import type { EcomLocalShopContent, EcomProduct } from "@/lib/app-builder/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "products.view")) ||
    (await requireAppCapability(slug, "products.edit")) ||
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await getAppProjectBySlug(slug);
  if (!project?.content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content: project.content });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "products.edit")) ||
    (await requireAppCapability(slug, "settings.edit")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await getAppProjectBySlug(slug);
  if (!project?.content || project.content.extensionId !== "ecom-local-shop") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    products?: EcomProduct[];
    brandName?: string;
    tagline?: string;
    description?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    ctaLabel?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    address?: string;
    openingHours?: string;
    aboutHtml?: string;
    primaryColor?: string;
    logoImageUrl?: string;
    heroImageUrl?: string;
    faqs?: Array<{ question: string; answer: string }>;
    /** When true, regenerate AI images for products missing a user-picked photo */
    autoImages?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const content: EcomLocalShopContent = { ...project.content };
  if (body.products) {
    const withImages =
      body.autoImages !== false
        ? ensureProductImages(body.products, {
            brandName: content.brandName,
            city: content.city,
          })
        : body.products;
    content.products = withImages;
    content.categories = [...new Set(withImages.map((p) => p.category || "General"))];
  }
  if (body.brandName?.trim()) content.brandName = body.brandName.trim();
  if (body.tagline !== undefined) content.tagline = body.tagline;
  if (body.description !== undefined) content.description = body.description;
  if (body.heroHeadline !== undefined) content.heroHeadline = body.heroHeadline;
  if (body.heroSubheadline !== undefined) content.heroSubheadline = body.heroSubheadline;
  if (body.ctaLabel !== undefined) content.ctaLabel = body.ctaLabel;
  if (body.contactEmail !== undefined) content.contactEmail = body.contactEmail;
  if (body.contactPhone !== undefined) content.contactPhone = body.contactPhone;
  if (body.whatsappNumber !== undefined) content.whatsappNumber = body.whatsappNumber;
  if (body.address !== undefined) content.address = body.address;
  if (body.openingHours !== undefined) content.openingHours = body.openingHours;
  if (body.aboutHtml !== undefined) content.aboutHtml = body.aboutHtml;
  if (body.primaryColor !== undefined) content.primaryColor = body.primaryColor;
  if (body.heroImageUrl !== undefined) content.heroImageUrl = body.heroImageUrl;
  if (body.logoImageUrl !== undefined) {
    content.logo = {
      ...content.logo,
      imageUrl: body.logoImageUrl,
      mode: body.logoImageUrl ? "upload" : content.logo?.mode,
    };
  }
  if (body.faqs) content.faqs = body.faqs;

  const next = {
    ...project,
    name: content.brandName,
    content,
    updatedAt: new Date().toISOString(),
  };
  await saveAppProject(next);
  return NextResponse.json({ content });
}
