import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { ensureProductImages } from "@/lib/app-builder/product-images";
import { isSafeMediaUrl, sanitizeShopHtml } from "@/lib/app-builder/security";
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
    secondaryColor?: string;
    accentColor?: string;
    surfaceColor?: string;
    themePalette?: string[];
    logoImageUrl?: string;
    logoBgFrom?: string;
    logoBgTo?: string;
    logoBadge?: string;
    logoMotif?: string;
    heroImageUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
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
    const cleaned = body.products.slice(0, 200).map((p, i) => ({
      ...p,
      id: String(p.id || `p${i + 1}`).slice(0, 64),
      name: String(p.name || "").slice(0, 120),
      description: String(p.description || "").slice(0, 1000),
      price: String(p.price || "").slice(0, 40),
      category: String(p.category || "General").slice(0, 60),
      image: p.image && isSafeMediaUrl(p.image) ? p.image : undefined,
      emoji: p.emoji ? String(p.emoji).slice(0, 8) : undefined,
      featured: Boolean(p.featured),
    }));
    const withImages =
      body.autoImages !== false
        ? ensureProductImages(cleaned, {
            brandName: content.brandName,
            city: content.city,
          })
        : cleaned;
    // Auto images are https pollinations - keep only safe URLs
    content.products = withImages.map((p) => ({
      ...p,
      image: p.image && isSafeMediaUrl(p.image) ? p.image : undefined,
    }));
    content.categories = [...new Set(content.products.map((p) => p.category || "General"))];
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
  if (body.aboutHtml !== undefined) content.aboutHtml = sanitizeShopHtml(body.aboutHtml);
  if (body.primaryColor !== undefined) content.primaryColor = body.primaryColor;
  if (body.secondaryColor !== undefined) content.secondaryColor = body.secondaryColor;
  if (body.accentColor !== undefined) content.accentColor = body.accentColor;
  if (body.surfaceColor !== undefined) content.surfaceColor = body.surfaceColor;
  if (body.themePalette !== undefined) {
    content.themePalette = body.themePalette
      .filter((c): c is string => typeof c === "string")
      .slice(0, 8);
  }
  if (body.seoTitle !== undefined) content.seoTitle = body.seoTitle;
  if (body.seoDescription !== undefined) content.seoDescription = body.seoDescription;
  if (body.heroImageUrl !== undefined) {
    if (body.heroImageUrl === "" || isSafeMediaUrl(body.heroImageUrl)) {
      content.heroImageUrl = body.heroImageUrl || undefined;
    } else {
      return NextResponse.json(
        { error: "Hero image must be an https image URL" },
        { status: 400 }
      );
    }
  }
  if (
    body.logoImageUrl !== undefined ||
    body.logoBgFrom !== undefined ||
    body.logoBgTo !== undefined ||
    body.logoBadge !== undefined ||
    body.logoMotif !== undefined
  ) {
    if (
      body.logoImageUrl !== undefined &&
      body.logoImageUrl !== "" &&
      !isSafeMediaUrl(body.logoImageUrl)
    ) {
      return NextResponse.json(
        { error: "Logo image must be an https image URL" },
        { status: 400 }
      );
    }
    content.logo = {
      ...content.logo,
      ...(body.logoImageUrl !== undefined
        ? {
            imageUrl: body.logoImageUrl || undefined,
            mode: body.logoImageUrl ? ("upload" as const) : content.logo?.mode,
          }
        : {}),
      ...(body.logoBgFrom !== undefined ? { bgFrom: body.logoBgFrom } : {}),
      ...(body.logoBgTo !== undefined ? { bgTo: body.logoBgTo } : {}),
      ...(body.logoBadge !== undefined ? { badge: String(body.logoBadge).slice(0, 80) } : {}),
      ...(body.logoMotif !== undefined ? { motif: String(body.logoMotif).slice(0, 40) } : {}),
    };
  }
  if (body.faqs) {
    content.faqs = body.faqs
      .slice(0, 20)
      .map((f) => ({
        question: String(f.question || "").slice(0, 200),
        answer: String(f.answer || "").slice(0, 1000),
      }))
      .filter((f) => f.question && f.answer);
  }

  const next = {
    ...project,
    name: content.brandName,
    content,
    updatedAt: new Date().toISOString(),
  };
  await saveAppProject(next);
  return NextResponse.json({ content });
}
