/**
 * Map App Studio research + prompt into GenericAppContent
 * so published apps render with real Verlin UI (VerlinAppRuntime).
 */

import { buildShopLogo } from "@/lib/app-builder/branding";
import { sanitizeShopHtml } from "@/lib/app-builder/security";
import type { GenericAppContent, GenericAppFeature, GenericAppPage } from "@/lib/app-builder/types";
import type { StudioResearchPack } from "@/lib/app-studio/types";

function slugPath(label: string, i: number): string {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return s || `page-${i}`;
}

function brandFromPrompt(prompt: string, research?: StudioResearchPack | null): string {
  const named = prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &'-]{2,40})/i)?.[1];
  if (named) return named.trim();
  if (/\byoga\b/i.test(prompt)) return "ZenFlow Studio";
  if (/\btask|kanban|board\b/i.test(prompt)) return "FlowBoard";
  if (/\bbook(ing)?\b/i.test(prompt)) return "BookEasy";
  const words = research?.summary?.split(/\s+/).slice(0, 3).join(" ");
  return words && words.length > 3 ? words.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 28) : "Studio App";
}

export function researchToVerlinContent(input: {
  prompt: string;
  research: StudioResearchPack;
  brandName?: string;
}): GenericAppContent {
  const brandName = input.brandName?.trim() || brandFromPrompt(input.prompt, input.research);
  const research = input.research;
  const city = "India";
  const logo = buildShopLogo(brandName, city);

  const screenLabels =
    research.screens?.length > 0
      ? research.screens
      : ["Home", "Features", "How it works", "Pricing", "FAQ", "Contact"];

  // Always start with home
  const labels = screenLabels.some((s) => /home/i.test(s))
    ? screenLabels
    : ["Home", ...screenLabels];

  const pages: GenericAppPage[] = labels.slice(0, 10).map((label, i) => {
    const path = i === 0 || /home/i.test(label) ? "home" : slugPath(label, i);
    const workflow = research.coreWorkflows[0];
    const stepsHtml = workflow?.steps?.length
      ? `<ol>${workflow.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
      : "";

    let body = "";
    if (path === "home") {
      body = `
        <p>${escapeHtml(research.summary)}</p>
        <p><strong>Who it's for:</strong> ${escapeHtml((research.targetUsers || []).join(", ") || "Primary users")}</p>
        ${workflow ? `<p><strong>${escapeHtml(workflow.name)}:</strong></p>${stepsHtml}` : ""}
        <p>Built with Verlin Labs App Studio - live product pages use Verlin UI components.</p>
      `;
    } else if (/faq/i.test(label)) {
      body = `
        <p>Common questions about ${escapeHtml(brandName)}.</p>
        <ul>
          <li><strong>What is this?</strong> ${escapeHtml(research.summary.slice(0, 200))}</li>
          <li><strong>Who is it for?</strong> ${escapeHtml((research.targetUsers || []).join(", "))}</li>
          <li><strong>How does it work?</strong> ${escapeHtml(workflow?.steps?.join(" → ") || "Start from the home page.")}</li>
        </ul>
      `;
    } else if (/contact|support/i.test(label)) {
      body = `
        <p>Reach the ${escapeHtml(brandName)} team.</p>
        <p>Email: hello@${slugPath(brandName, 0)}.example</p>
        <p>Phone: +91 90000 00000</p>
      `;
    } else if (/feature|product|pricing|plan|membership/i.test(label)) {
      const feats = research.coreWorkflows.flatMap((w) => w.steps).slice(0, 6);
      body = `
        <p>${escapeHtml(label)} for ${escapeHtml(brandName)}.</p>
        <ul>${(feats.length ? feats : research.dataEntities || []).map((f) => `<li>${escapeHtml(String(f))}</li>`).join("")}</ul>
      `;
    } else {
      body = `
        <p><strong>${escapeHtml(label)}</strong></p>
        <p>${escapeHtml(research.summary)}</p>
        ${stepsHtml}
      `;
    }

    return {
      id: path,
      path,
      title: label,
      headline: path === "home" ? brandName : label,
      bodyHtml: sanitizeShopHtml(body),
      ctaLabel: path === "home" ? "Get started" : path === "contact" ? "Send message" : undefined,
    };
  });

  // Ensure contact + faq
  if (!pages.some((p) => p.path === "faq")) {
    pages.push({
      id: "faq",
      path: "faq",
      title: "FAQ",
      headline: "Questions",
      bodyHtml: sanitizeShopHtml(
        `<p>FAQ for ${escapeHtml(brandName)}.</p><p>${escapeHtml(research.summary)}</p>`
      ),
    });
  }
  if (!pages.some((p) => p.path === "contact")) {
    pages.push({
      id: "contact",
      path: "contact",
      title: "Contact",
      headline: "Contact us",
      bodyHtml: sanitizeShopHtml(
        `<p>Email hello@example.com · Phone +91 90000 00000</p>`
      ),
      ctaLabel: "Send message",
    });
  }

  const features: GenericAppFeature[] = (research.coreWorkflows || []).flatMap((w, wi) =>
    (w.steps || []).slice(0, 3).map((step, si) => ({
      id: `f-${wi}-${si}`,
      title: step,
      body: `Part of “${w.name}” workflow`,
      icon: si === 0 ? "✅" : "✨",
    }))
  );

  if (!features.length) {
    features.push(
      { id: "f1", title: "Clear homepage", body: research.summary.slice(0, 120), icon: "✅" },
      { id: "f2", title: "Core workflow", body: "Main user job supported end to end", icon: "✨" }
    );
  }

  const competitorsNote =
    research.competitors?.length > 0
      ? research.competitors.map((c) => `${c.name}: ${c.takeaway}`).join(" · ")
      : "";

  const content: GenericAppContent = {
    extensionId: "generic-app",
    appKind: "studio-app",
    brandName,
    tagline: research.summary.slice(0, 100),
    description: research.summary,
    primaryColor: "#0f2744",
    secondaryColor: "#1a3a5c",
    accentColor: "#0d9488",
    surfaceColor: "#f0fdfa",
    themePalette: ["#0f2744", "#0d9488", "#f59e0b", "#f0fdfa"],
    city,
    contactEmail: "hello@example.com",
    contactPhone: "+91 90000 00000",
    heroHeadline: brandName,
    heroSubheadline: research.summary.slice(0, 160),
    ctaLabel: "Get started",
    secondaryCtaLabel: "Learn more",
    aboutHtml: sanitizeShopHtml(
      `<p>${escapeHtml(research.summary)}</p>
       <p><strong>Users:</strong> ${escapeHtml((research.targetUsers || []).join(", "))}</p>
       ${competitorsNote ? `<p><strong>Market notes:</strong> ${escapeHtml(competitorsNote)}</p>` : ""}`
    ),
    logo: {
      initials: logo.initials,
      emoji: logo.emoji,
      motif: logo.motif,
      bgFrom: logo.bgFrom,
      bgTo: logo.bgTo,
      badge: logo.badge,
      mode: "generate",
    },
    nav: pages.slice(0, 6).map((p) => ({ path: p.path, label: p.title })),
    pages,
    features: features.slice(0, 8),
    faqs: [
      {
        question: `What is ${brandName}?`,
        answer: research.summary,
      },
      {
        question: "Who is it for?",
        answer: (research.targetUsers || []).join(", ") || "Primary users",
      },
      {
        question: "How do I get started?",
        answer:
          research.coreWorkflows[0]?.steps?.join(" → ") ||
          "Open the app, explore pages, and complete the main workflow.",
      },
    ],
    trustBadges: ["Research-backed plan", "Verlin UI", "Hosted on Verlin Labs"],
    footerNote: `© ${brandName} · Built with Verlin Labs App Studio`,
    seoTitle: `${brandName} · Verlin Labs`,
    seoDescription: research.summary.slice(0, 155),
    customBlocks: (research.dataEntities || []).slice(0, 6).map((e) => ({
      title: String(e),
      body: `Data entity used in ${brandName}`,
    })),
  };

  return content;
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
