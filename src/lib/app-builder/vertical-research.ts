/**
 * Vertical Research Agent core — research an app type and persist to ops memory.
 * Runs immediately when research is missing for a vertical.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import {
  getVerticalResearch,
  logExperience,
  upsertVerticalResearch,
} from "@/lib/app-builder/ops-memory";
import type { VerticalResearchPack } from "@/lib/app-builder/ops-memory-types";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";

export type ResearchInput = {
  verticalId: string;
  label?: string;
  ideaPrompt?: string;
  force?: boolean;
};

const KNOWN_STARTERS: Record<string, Partial<VerticalResearchPack>> = {
  "ecom-local-shop": {
    label: "Local shop / catalogue",
    plainLabel: "A simple online shop for a neighbourhood business",
    leaders: [
      {
        name: "Dukaan",
        why: "India MSME online store in minutes",
        lesson: "WhatsApp-first order + simple product cards",
      },
      {
        name: "Shopify",
        why: "Global commerce default",
        lesson: "Launch checklist + product photos matter",
      },
      {
        name: "Meesho seller",
        why: "Catalog for small sellers",
        lesson: "Low friction listing; clear price",
      },
    ],
    visitorJobs: ["Browse products", "Order via WhatsApp", "Contact shop"],
    ownerJobs: ["Manage products", "Orders", "Brand & theme", "Team"],
    publicPages: ["home", "shop", "about", "faq", "contact"],
    adminMenus: [
      "Overview",
      "Products",
      "Orders",
      "CRM",
      "Site CMS",
      "Brand & theme",
      "Team",
      "Roles",
    ],
    interviewThemes: [
      "offline day",
      "customer steps",
      "products",
      "channels",
      "payment",
      "logo",
    ],
    channels: ["WhatsApp", "Phone", "Walk-in", "Instagram"],
    paymentNorms: ["UPI", "Cash", "COD"],
    roles: [
      { id: "super_admin", label: "Owner" },
      { id: "admin", label: "Manager" },
      { id: "staff", label: "Staff" },
      { id: "customer", label: "Customer", default: true },
    ],
    seoNotes: ["Brand · City | offer title", "Local FAQ", "Share link first"],
    premiumization: ["Real product photos", "City-specific trust", "Clear CTA"],
    visualNotes: ["Hero photo", "Product images", "Logo upload"],
    multiColourNotes: [
      "primary + secondary + accent + palette",
      "Never single-colour UI",
    ],
    risks: ["Missing photos", "No WhatsApp number", "Weak about page"],
    launchChecklist: [
      "Open live link",
      "Take tour",
      "Add products + photos",
      "Brand & theme",
      "Share WhatsApp",
    ],
    sources: ["internal:ecom-local-shop", "industry:dukaan-shopify"],
  },
  "booking-local": {
    label: "Local booking / appointments",
    plainLabel: "Let customers book slots for services nearby",
    leaders: [
      {
        name: "Practo (clinic-style)",
        why: "Appointment mental model",
        lesson: "Clear slots + confirmation channel",
      },
      {
        name: "Booksy / Fresha",
        why: "Salon booking",
        lesson: "Service list + staff + time",
      },
    ],
    visitorJobs: ["See services", "Pick slot", "Confirm"],
    ownerJobs: ["Services", "Calendar", "Staff", "Customers"],
    publicPages: ["home", "services", "book", "about", "contact"],
    adminMenus: ["Overview", "Bookings", "Services", "Staff", "CRM", "Settings"],
    interviewThemes: ["service list", "hours", "staff", "deposit", "no-show"],
    channels: ["WhatsApp confirm", "Phone", "Walk-in"],
    paymentNorms: ["Pay at visit", "UPI advance"],
    roles: [
      { id: "super_admin", label: "Owner" },
      { id: "staff", label: "Staff" },
      { id: "customer", label: "Customer", default: true },
    ],
    seoNotes: ["Service + city", "Hours in FAQ"],
    premiumization: ["Trust + cancellation policy clarity"],
    visualNotes: ["Service photos", "Calm multi-colour"],
    multiColourNotes: ["Calm primary, warm accent for CTAs"],
    risks: ["Double booking", "No show policy missing"],
    launchChecklist: ["Set hours", "Add services", "Test booking", "Share link"],
    sources: ["internal:booking-starter"],
  },
  "tuition-centre": {
    label: "Tuition / coaching centre",
    plainLabel: "Show batches, fees, and enquiry for a local tuition",
    leaders: [
      {
        name: "Local coaching WhatsApp pages",
        why: "How parents actually enquire",
        lesson: "Batch + fee + demo class clarity",
      },
    ],
    visitorJobs: ["See courses/batches", "Enquire", "Contact"],
    ownerJobs: ["Batches", "Enquiries", "Team", "CMS"],
    publicPages: ["home", "courses", "about", "faq", "contact"],
    adminMenus: ["Overview", "Courses", "Enquiries", "Team", "CMS", "Settings"],
    interviewThemes: ["subjects", "boards", "batch timing", "fees", "demo"],
    channels: ["WhatsApp", "Phone", "Parent walk-in"],
    paymentNorms: ["Monthly fee", "UPI"],
    roles: [
      { id: "super_admin", label: "Owner" },
      { id: "teacher", label: "Teacher" },
      { id: "parent", label: "Parent", default: true },
    ],
    seoNotes: ["Subject + city + board"],
    premiumization: ["Results language without fake claims"],
    visualNotes: ["Warm study palette"],
    multiColourNotes: ["Trust secondary + bright CTA accent"],
    risks: ["Fake result claims"],
    launchChecklist: ["List batches", "Fees FAQ", "Contact WhatsApp"],
    sources: ["internal:tuition-starter"],
  },
};

function seedFromKnown(verticalId: string, label?: string): VerticalResearchPack | null {
  const starter = KNOWN_STARTERS[verticalId];
  if (!starter) return null;
  const now = new Date().toISOString();
  return {
    id: verticalId,
    label: label || starter.label || verticalId,
    plainLabel: starter.plainLabel || label || verticalId,
    researchedAt: now,
    updatedAt: now,
    sources: starter.sources || [],
    leaders: starter.leaders || [],
    visitorJobs: starter.visitorJobs || [],
    ownerJobs: starter.ownerJobs || [],
    publicPages: starter.publicPages || [],
    adminMenus: starter.adminMenus || [],
    interviewThemes: starter.interviewThemes || [],
    channels: starter.channels || [],
    paymentNorms: starter.paymentNorms || [],
    roles: starter.roles || [],
    seoNotes: starter.seoNotes || [],
    premiumization: starter.premiumization || [],
    visualNotes: starter.visualNotes || [],
    multiColourNotes: starter.multiColourNotes || [],
    risks: starter.risks || [],
    launchChecklist: starter.launchChecklist || [],
    rawNotes: starter.rawNotes || "",
    useCount: 0,
  };
}

function heuristicResearch(
  verticalId: string,
  label?: string,
  ideaPrompt?: string
): VerticalResearchPack {
  const now = new Date().toISOString();
  const name = label || verticalId.replace(/-/g, " ");
  return {
    id: verticalId,
    label: name,
    plainLabel: `A simple app for ${name}`,
    researchedAt: now,
    updatedAt: now,
    sources: ["heuristic"],
    leaders: [],
    visitorJobs: ["Learn what is offered", "Contact or act", "Trust the owner"],
    ownerJobs: ["Update offer", "See enquiries/orders", "Manage team"],
    publicPages: ["home", "offer", "about", "faq", "contact"],
    adminMenus: ["Overview", "Offer", "CRM", "Site CMS", "Brand & theme", "Team", "Roles"],
    interviewThemes: [
      "offline workflow",
      "customer steps",
      "offer list",
      "channels",
      "payment",
      "logo",
    ],
    channels: ["WhatsApp", "Phone"],
    paymentNorms: ["UPI", "Cash"],
    roles: [
      { id: "super_admin", label: "Owner" },
      { id: "staff", label: "Staff" },
      { id: "customer", label: "Customer", default: true },
    ],
    seoNotes: [`${name} · city`, "Clear meta description", "FAQ for how to start"],
    premiumization: ["Specific offer", "Local trust", "Real photos"],
    visualNotes: ["Multi-colour from logo", "Hero + offer images"],
    multiColourNotes: ["primary secondary accent palette"],
    risks: ["Generic copy", "No contact path"],
    launchChecklist: ["Fill offer", "Contact works", "Share link"],
    rawNotes: ideaPrompt?.slice(0, 500) || "",
    useCount: 0,
  };
}

/**
 * Ensure research exists for a vertical. If missing (or force), research and save to ops DB.
 */
export async function ensureVerticalResearched(
  input: ResearchInput
): Promise<{ pack: VerticalResearchPack; created: boolean; source: string }> {
  const id = input.verticalId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!input.force) {
    const existing = await getVerticalResearch(id);
    if (
      existing &&
      (existing.leaders.length > 0 ||
        existing.publicPages.length > 0 ||
        existing.interviewThemes.length > 0)
    ) {
      return { pack: existing, created: false, source: "ops-memory" };
    }
  }

  // 1) Known starter seed
  let pack = seedFromKnown(id, input.label);

  // 2) LLM expand / create
  const secrets = resolveAppBuilderSecrets();
  if (secrets) {
    try {
      const raw = await callUserLlm({
        secrets,
        temperature: 0.35,
        maxTokens: 2800,
        timeoutMs: 55_000,
        messages: [
          {
            role: "system",
            content: `You research application verticals for Verlin Labs App Builder (India-first local businesses).
Return ONLY JSON for a research pack with keys:
id, label, plainLabel, sources (string[]), leaders ({name,why,lesson}[]),
visitorJobs, ownerJobs, publicPages, adminMenus, interviewThemes, channels,
paymentNorms, roles ({id,label,default?}[]), seoNotes, premiumization,
visualNotes, multiColourNotes, risks, launchChecklist, rawNotes.
Language: practical, non-tech. Multi-colour themes always. WhatsApp/UPI reality for India when relevant.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              verticalId: id,
              label: input.label || pack?.label || id,
              ideaPrompt: input.ideaPrompt || "",
              seed: pack || null,
              task: pack
                ? "Enrich this seed with more leaders, interview themes, risks, SEO, multi-colour notes."
                : "Create a full research pack for this app vertical.",
            }),
          },
        ],
      });
      const parsed = parseJsonObject<Partial<VerticalResearchPack>>(raw);
      const base = pack || heuristicResearch(id, input.label, input.ideaPrompt);
      pack = {
        ...base,
        ...parsed,
        id,
        label: parsed.label || base.label,
        plainLabel: parsed.plainLabel || base.plainLabel,
        sources: [
          ...new Set([...(parsed.sources || []), ...(base.sources || []), "llm-research"]),
        ],
        leaders: parsed.leaders?.length ? parsed.leaders : base.leaders,
        visitorJobs: parsed.visitorJobs?.length ? parsed.visitorJobs : base.visitorJobs,
        ownerJobs: parsed.ownerJobs?.length ? parsed.ownerJobs : base.ownerJobs,
        publicPages: parsed.publicPages?.length ? parsed.publicPages : base.publicPages,
        adminMenus: parsed.adminMenus?.length ? parsed.adminMenus : base.adminMenus,
        interviewThemes: parsed.interviewThemes?.length
          ? parsed.interviewThemes
          : base.interviewThemes,
        channels: parsed.channels?.length ? parsed.channels : base.channels,
        paymentNorms: parsed.paymentNorms?.length ? parsed.paymentNorms : base.paymentNorms,
        roles: parsed.roles?.length ? parsed.roles : base.roles,
        seoNotes: parsed.seoNotes?.length ? parsed.seoNotes : base.seoNotes,
        premiumization: parsed.premiumization?.length
          ? parsed.premiumization
          : base.premiumization,
        visualNotes: parsed.visualNotes?.length ? parsed.visualNotes : base.visualNotes,
        multiColourNotes: parsed.multiColourNotes?.length
          ? parsed.multiColourNotes
          : base.multiColourNotes,
        risks: parsed.risks?.length ? parsed.risks : base.risks,
        launchChecklist: parsed.launchChecklist?.length
          ? parsed.launchChecklist
          : base.launchChecklist,
        rawNotes: String(parsed.rawNotes || base.rawNotes || "").slice(0, 2000),
        researchedAt: base.researchedAt,
        updatedAt: new Date().toISOString(),
        useCount: base.useCount || 0,
      };
    } catch {
      // fall through
    }
  }

  if (!pack) {
    pack = heuristicResearch(id, input.label, input.ideaPrompt);
  }

  const saved = await upsertVerticalResearch(pack);
  await logExperience({
    agent: "vertical-research",
    kind: "research",
    verticalId: id,
    summary: `Researched vertical: ${saved.label}`,
    detail: `Sources: ${saved.sources.join(", ")}. Pages: ${saved.publicPages.join(", ")}.`,
    tags: ["research", id],
    productionSafe: true,
  });

  return {
    pack: saved,
    created: true,
    source: pack.sources.includes("llm-research") ? "llm+ops-memory" : "seed+ops-memory",
  };
}
