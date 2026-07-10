/**
 * Convert an approved ProductPlan into GenericAppContent pages (rich, not hollow).
 */

import { buildShopLogo } from "@/lib/app-builder/branding";
import { heroImageUrl } from "@/lib/app-builder/images";
import type { ProductPlan } from "@/lib/app-builder/product-plan-types";
import { sanitizeShopHtml } from "@/lib/app-builder/security";
import type { GenericAppContent, GenericAppFeature, GenericAppPage } from "@/lib/app-builder/types";

function pageBody(plan: ProductPlan, page: ProductPlan["publicPages"][0]): string {
  const parts: string[] = [];
  parts.push(`<p><strong>Purpose:</strong> ${page.purpose}</p>`);
  if (page.sections?.length) {
    parts.push("<p><strong>On this page:</strong></p><ul>");
    for (const s of page.sections) {
      parts.push(`<li>${s}</li>`);
    }
    parts.push("</ul>");
  }
  if (page.zone === "authenticated") {
    parts.push(
      "<p><em>Demo / authenticated module</em> — mocked data for a clickable prototype. States include empty, loading, error, and success where relevant.</p>"
    );
  }
  parts.push(`<p>${plan.valueProp}</p>`);
  return sanitizeShopHtml(parts.join("\n"));
}

export function productPlanToGenericContent(plan: ProductPlan): GenericAppContent {
  const city = plan.region || "India";
  const logo = (() => {
    const b = buildShopLogo(plan.brandName, city);
    return {
      initials: b.initials,
      emoji: b.emoji,
      motif: b.motif,
      bgFrom: b.bgFrom,
      bgTo: b.bgTo,
      badge: b.badge,
      mode: "generate" as const,
    };
  })();

  const pages: GenericAppPage[] = plan.publicPages.map((p, i) => ({
    id: p.path || `p${i}`,
    path: (p.path || `page-${i}`).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40),
    title: p.title,
    headline: p.title,
    bodyHtml: pageBody(plan, p),
    ctaLabel:
      p.path === "home" || p.path === "apply" || p.path === "quote"
        ? plan.features[0]?.title
          ? "Get started"
          : "Continue"
        : p.zone === "authenticated"
          ? "Back to dashboard"
          : undefined,
  }));

  // Ensure contact/faq exist
  if (!pages.some((p) => p.path === "faq") && plan.publicPages.length) {
    pages.push({
      id: "faq",
      path: "faq",
      title: "FAQ",
      headline: "Questions",
      bodyHtml: sanitizeShopHtml(
        `<p>Common questions about ${plan.brandName}.</p><ul>${plan.assumptions
          .slice(0, 3)
          .map((x) => `<li>${x}</li>`)
          .join("")}</ul>`
      ),
    });
  }

  const features: GenericAppFeature[] = plan.features.map((f) => ({
    id: f.id,
    title: f.title,
    body: `${f.description} (${f.priority})`,
    icon: f.priority === "must" ? "✅" : "✨",
  }));

  const faqs = [
    {
      question: `What is ${plan.brandName}?`,
      answer: plan.valueProp,
    },
    {
      question: "Who is it for?",
      answer: plan.audience.join(", ") || "Primary users of this product",
    },
    {
      question: "Is this a live bank / live service?",
      answer:
        plan.assumptions[0] ||
        "This is a complete clickable website prototype with mocked authenticated flows where noted.",
    },
    {
      question: "What is included in v1?",
      answer: plan.features
        .filter((f) => f.priority === "must")
        .map((f) => f.title)
        .join(", "),
    },
    {
      question: "What is out of scope?",
      answer: plan.outOfScope.join("; ") || "Full production backends.",
    },
  ];

  const extId = (
    plan.extensionId === "ecom-local-shop" ? "generic-app" : plan.extensionId
  ) as GenericAppContent["extensionId"];

  return {
    extensionId: extId,
    appKind: plan.appKind,
    brandName: plan.brandName,
    tagline: plan.tagline,
    description: plan.businessModelDetail.slice(0, 500),
    primaryColor: logo.bgFrom || "#0d9488",
    secondaryColor: logo.bgTo || "#0a1628",
    accentColor: logo.bgFrom,
    themePalette: [logo.bgFrom, logo.bgTo, "#0f766e", "#134e4a"],
    city,
    contactEmail: "hello@example.com",
    contactPhone: "",
    heroHeadline: plan.valueProp.slice(0, 90) || plan.brandName,
    heroSubheadline: `${plan.businessModel} · ${plan.region}. ${plan.summary.slice(0, 140)}`,
    ctaLabel: "Explore products",
    secondaryCtaLabel: "Open demo dashboard",
    aboutHtml: sanitizeShopHtml(
      `<p>${plan.businessModelDetail}</p><p><strong>Audience:</strong> ${plan.audience.join(", ")}</p><p>${plan.summary}</p>`
    ),
    logo,
    heroImageUrl: heroImageUrl({
      brandName: plan.brandName,
      city,
      whatYouSell: plan.businessModel,
      vibe: "trustworthy modern professional fintech",
    }),
    nav: pages
      .filter((p) =>
        ["home", "products", "plans", "features", "dashboard", "apply", "quote", "about", "faq", "contact"].includes(
          p.path
        )
      )
      .slice(0, 8)
      .map((p) => ({ path: p.path, label: p.title })),
    pages,
    features,
    faqs,
    trustBadges: plan.trustCompliance.slice(0, 5).map((t) => t.slice(0, 40)),
    footerNote: `© ${new Date().getFullYear()} ${plan.brandName} · ${plan.region} · Demo prototype`,
    seoTitle: `${plan.brandName} · ${plan.businessModel}`.slice(0, 60),
    seoDescription: plan.summary.slice(0, 160),
    customBlocks: [
      ...plan.modules.map((m) => ({
        title: `Module: ${m.title}`,
        body: `${m.purpose}. States: ${m.states.join(", ")}. Behaviors: ${m.behaviors.join(", ")}.`,
      })),
      ...plan.personas.map((p) => ({
        title: `Persona: ${p.name}`,
        body: `${p.goal}. Journey: ${p.journey.join(" → ")}.`,
      })),
    ],
  };
}
