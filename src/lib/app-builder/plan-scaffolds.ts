/**
 * High-quality plan scaffolds — banking / insurance / resume / booking.
 * Used when answers are thin; LLM enriches but never invents hollow 3-page shells.
 */

import type { ProductPlan } from "@/lib/app-builder/product-plan-types";

function baseMeta(
  partial: Pick<
    ProductPlan,
    | "brandName"
    | "tagline"
    | "businessModel"
    | "businessModelDetail"
    | "region"
    | "audience"
    | "valueProp"
    | "extensionId"
    | "appKind"
    | "summary"
  >
): Omit<
  ProductPlan,
  | "publicPages"
  | "modules"
  | "personas"
  | "features"
  | "trustCompliance"
  | "assumptions"
  | "outOfScope"
  | "researchedAt"
  | "researchSource"
> {
  return {
    version: 1,
    ...partial,
  };
}

export function bankingScaffold(input: {
  brandName?: string;
  region?: string;
  model?: "retail" | "sme" | "neobank";
}): ProductPlan {
  const brand = input.brandName || "Horizon Bank";
  const region = input.region || "India";
  const model = input.model || "neobank";
  const isSme = model === "sme";

  return {
    ...baseMeta({
      brandName: brand,
      tagline: isSme
        ? "Business banking built for growing companies"
        : "Simple digital banking for everyday money",
      businessModel: isSme
        ? "SME / Business banking"
        : model === "retail"
          ? "Retail / consumer banking"
          : "Neobank / challenger (digital-only)",
      businessModelDetail: isSme
        ? "Sole traders and limited companies: business accounts, multi-user access, payments, and lending discovery. Website = marketing + apply funnel + mocked authenticated dashboard."
        : "Individuals: current/savings, cards, payments, transfers. Website = public acquisition site + mocked post-login dashboard with realistic empty/loading/error/success states.",
      region,
      audience: isSme
        ? ["Sole traders", "Finance managers", "Business owners"]
        : ["Salaried individuals", "Students", "Families"],
      valueProp: isSme
        ? "Open a business account online, pay vendors, track cash, invite team roles — without branch paperwork drama."
        : "Open an account in minutes, pay anyone, freeze cards, and see spend clearly — mobile-first and fee-transparent.",
      extensionId: "digital-banking",
      appKind: "digital-banking",
      summary: `Complete digital banking website for ${brand}: public product & trust pages PLUS authenticated dashboard modules (accounts, payments, cards, statements) with mocked data and clear states.`,
    }),
    publicPages: [
      {
        path: "home",
        title: "Home",
        purpose: "Value prop, primary products, trust signals, apply CTA",
        sections: [
          "Hero with primary CTA (Open account / Get started)",
          "Product strip (accounts, cards, payments, loans)",
          "Trust bar (security, regulation framing, uptime)",
          "How it works (3 steps)",
          "Security centre teaser",
          "Footer with rates/disclaimer links",
        ],
        zone: "public",
      },
      {
        path: "products",
        title: "Products",
        purpose: "Product hub listing all offerings",
        sections: ["Accounts", "Cards", "Payments", "Savings", isSme ? "Business loans" : "Personal loans", "Compare CTAs"],
        zone: "public",
      },
      {
        path: "accounts",
        title: "Accounts",
        purpose: "Current / savings product detail",
        sections: ["Who it's for", "Key benefits", "Fees overview", "Eligibility", "Apply CTA"],
        zone: "public",
      },
      {
        path: "cards",
        title: "Cards",
        purpose: "Debit/virtual cards product",
        sections: ["Card types", "Controls (freeze, limits)", "Security", "Apply / link from account"],
        zone: "public",
      },
      {
        path: "payments",
        title: "Payments",
        purpose: "Transfers and pay bills story",
        sections: ["Domestic transfers", "UPI / instant pay framing", "Standing orders", "Safety tips"],
        zone: "public",
      },
      {
        path: "rates",
        title: "Rates & fees",
        purpose: "Transparent pricing",
        sections: ["Account fees table", "Transfer fees", "Interest rates", "Disclaimers"],
        zone: "public",
      },
      {
        path: "security",
        title: "Security centre",
        purpose: "Trust and fraud education",
        sections: ["2FA", "Session timeout messaging", "How we protect you", "Report fraud CTA"],
        zone: "public",
      },
      {
        path: "apply",
        title: "Apply / Onboarding",
        purpose: "Entry to open-account funnel",
        sections: ["Choose product", "What you'll need (KYC/KYB list)", "Timeline", "Start application CTA"],
        zone: "public",
      },
      {
        path: "help",
        title: "Help & support",
        purpose: "Self-serve help",
        sections: ["FAQ categories", "Contact channels", "Service status note"],
        zone: "public",
      },
      {
        path: "about",
        title: "About",
        purpose: "Brand story and region focus",
        sections: ["Mission", "Who we serve", "Region focus"],
        zone: "public",
      },
      {
        path: "dashboard",
        title: "Dashboard (demo)",
        purpose: "Authenticated overview mock",
        sections: ["Balances", "Recent transactions", "Quick actions", "Security banner"],
        zone: "authenticated",
      },
      {
        path: "transactions",
        title: "Transactions (demo)",
        purpose: "History with filter",
        sections: ["Search", "Date/category filter", "List states empty/loading/results"],
        zone: "authenticated",
      },
      {
        path: "transfer",
        title: "Pay & transfer (demo)",
        purpose: "Payment flow mock",
        sections: ["Payee", "Amount", "Reference", "Review", "2FA step", "Success/failure"],
        zone: "authenticated",
      },
      {
        path: "cards-manage",
        title: "Cards (demo)",
        purpose: "Card controls mock",
        sections: ["Card list", "Freeze toggle", "Limits", "PIN/virtual card notes"],
        zone: "authenticated",
      },
      {
        path: "statements",
        title: "Statements (demo)",
        purpose: "Documents mock",
        sections: ["Monthly statements list", "Download placeholder", "Empty state"],
        zone: "authenticated",
      },
      {
        path: "insights",
        title: "Spend insights (demo)",
        purpose: "PFM mock",
        sections: ["Categories chart copy", "Budget note", "Empty state"],
        zone: "authenticated",
      },
      {
        path: "profile",
        title: "Profile & security (demo)",
        purpose: "Settings mock",
        sections: ["Profile", "2FA status", "Notifications", isSme ? "Team roles" : "Devices"],
        zone: "authenticated",
      },
      {
        path: "faq",
        title: "FAQ",
        purpose: "Common banking questions",
        sections: ["Account opening", "Fees", "Security", "Support"],
        zone: "public",
      },
      {
        path: "contact",
        title: "Contact",
        purpose: "Reach support",
        sections: ["Phone/email/WhatsApp", "Hours", "Secure message note"],
        zone: "public",
      },
    ],
    modules: [
      {
        id: "account-overview",
        title: "Account overview",
        purpose: "Show balances and quick actions",
        states: ["empty (no account)", "loading", "success", "error"],
        behaviors: ["Select account", "Hide balance", "Jump to transfer"],
        zone: "authenticated",
      },
      {
        id: "payments",
        title: "Payments & transfers",
        purpose: "Domestic pay with review-confirm-2FA",
        states: ["form", "validation error", "review", "2FA", "success", "failure"],
        behaviors: ["Pick payee", "Amount limits", "Reference max length", "Confirm"],
        zone: "authenticated",
      },
      {
        id: "cards",
        title: "Cards management",
        purpose: "Freeze/unfreeze and limits",
        states: ["active", "frozen", "loading", "error"],
        behaviors: ["Toggle freeze", "Set spend limit", "Request virtual card (stub)"],
        zone: "authenticated",
      },
      {
        id: "onboarding",
        title: "Apply / onboarding entry",
        purpose: "Start KYC-ready apply flow",
        states: ["choose product", "document checklist", "submitted"],
        behaviors: ["Select product", "See required docs", "Submit interest"],
        zone: "public",
      },
    ],
    personas: isSme
      ? [
          {
            name: "Sole trader",
            goal: "Open business account and accept payments",
            journey: ["Land on home", "Read business account", "Apply", "Demo dashboard"],
          },
          {
            name: "Finance manager",
            goal: "Pay vendors and export statements",
            journey: ["Login demo", "Transfer flow", "Statements", "Team roles"],
          },
        ]
      : [
          {
            name: "First-time digital bank user",
            goal: "Open account and send first payment",
            journey: ["Home", "Products", "Apply", "Dashboard", "Transfer demo"],
          },
          {
            name: "Everyday payer",
            goal: "Pay bills and control card",
            journey: ["Dashboard", "Transactions", "Cards freeze", "Insights"],
          },
        ],
    features: [
      { id: "f1", title: "Public product catalogue", description: "Accounts, cards, payments, rates", priority: "must" },
      { id: "f2", title: "Apply / onboarding entry", description: "Clear checklist and CTA", priority: "must" },
      { id: "f3", title: "Mock dashboard", description: "Balances and quick actions", priority: "must" },
      { id: "f4", title: "Payments flow demo", description: "Review → 2FA → success/fail", priority: "must" },
      { id: "f5", title: "Card controls demo", description: "Freeze and limits", priority: "must" },
      { id: "f6", title: "Security centre", description: "Trust messaging throughout", priority: "must" },
      { id: "f7", title: "Rates & fees", description: "Transparent pricing tables", priority: "should" },
      { id: "f8", title: "Spend insights", description: "Simple PFM mock", priority: "should" },
    ],
    trustCompliance: [
      "Rates and fees disclaimers on product and rates pages",
      "Deposit guarantee / regulatory framing in footer (region-appropriate, fictional bank)",
      "Security messaging: 2FA, session care, fraud tips",
      "Cookie/consent note in footer",
      "No fake banking licence numbers — label as demo/fictional where needed",
    ],
    assumptions: [
      "v1 is a clickable prototype: real navigation, mocked data, no live core banking",
      "Authenticated pages are demo screens (no real login vault)",
      "India-friendly channels (UPI language) when region is India",
    ],
    outOfScope: [
      "Real money movement or bank APIs",
      "Full KYC vendor integration",
      "Live card issuing",
      "Native mobile apps",
    ],
    researchedAt: new Date().toISOString(),
    researchSource: "scaffold:digital-banking",
  };
}

export function insuranceScaffold(input: { brandName?: string; region?: string }): ProductPlan {
  const brand = input.brandName || "ShieldCover";
  const region = input.region || "India";
  return {
    ...baseMeta({
      brandName: brand,
      tagline: "Insurance explained simply — plans, claims, trust",
      businessModel: "Digital insurance distributor / insurer marketing site",
      businessModelDetail:
        "Public site for health/term/motor plan discovery, quote interest, claims FAQ, and a light authenticated claims-status demo.",
      region,
      audience: ["Families", "Young professionals", "Parents buying term cover"],
      valueProp: "Compare simple plans, understand claims, and start a quote without jargon.",
      extensionId: "insurance",
      appKind: "insurance",
      summary: `Insurance website for ${brand}: plan hub, product pages, quote entry, claims help, trust/compliance, plus claims-status demo module.`,
    }),
    publicPages: [
      {
        path: "home",
        title: "Home",
        purpose: "Hero + plan types + trust",
        sections: ["Hero CTA Get quote", "Plan cards", "Why us", "Claims promise", "Disclaimers"],
        zone: "public",
      },
      {
        path: "plans",
        title: "Plans",
        purpose: "Plan hub",
        sections: ["Health", "Term life", "Motor", "Compare"],
        zone: "public",
      },
      {
        path: "health",
        title: "Health insurance",
        purpose: "Product detail",
        sections: ["Cover highlights", "Exclusions summary", "Who it's for", "Get quote"],
        zone: "public",
      },
      {
        path: "term",
        title: "Term life",
        purpose: "Product detail",
        sections: ["Cover amount examples", "Riders", "Eligibility", "Get quote"],
        zone: "public",
      },
      {
        path: "claims",
        title: "Claims",
        purpose: "How claims work",
        sections: ["Steps", "Documents needed", "Timeline", "Track claim CTA"],
        zone: "public",
      },
      {
        path: "quote",
        title: "Get a quote",
        purpose: "Lead / quote interest",
        sections: ["Plan select", "Basic details form mock", "What happens next"],
        zone: "public",
      },
      {
        path: "dashboard",
        title: "My policies (demo)",
        purpose: "Authenticated policy list mock",
        sections: ["Policy cards", "Renewal dates", "Empty state"],
        zone: "authenticated",
      },
      {
        path: "claim-status",
        title: "Claim status (demo)",
        purpose: "Track claim mock",
        sections: ["Claim id", "Status timeline", "Upload note", "Support"],
        zone: "authenticated",
      },
      {
        path: "faq",
        title: "FAQ",
        purpose: "Common insurance Qs",
        sections: ["Buying", "Claims", "Waiting periods"],
        zone: "public",
      },
      {
        path: "about",
        title: "About",
        purpose: "Brand trust",
        sections: ["Mission", "How we work"],
        zone: "public",
      },
      {
        path: "contact",
        title: "Contact",
        purpose: "Support",
        sections: ["Phone", "Email", "Hours"],
        zone: "public",
      },
    ],
    modules: [
      {
        id: "quote",
        title: "Quote interest",
        purpose: "Capture plan interest",
        states: ["form", "validation", "submitted"],
        behaviors: ["Select plan", "Submit contact"],
        zone: "public",
      },
      {
        id: "claims-track",
        title: "Claim tracking demo",
        purpose: "Show claim lifecycle",
        states: ["empty", "in progress", "settled"],
        behaviors: ["View timeline", "Contact support"],
        zone: "authenticated",
      },
    ],
    personas: [
      {
        name: "Parent buying term cover",
        goal: "Understand cover and start quote",
        journey: ["Home", "Term", "Quote", "FAQ"],
      },
      {
        name: "Claimant",
        goal: "Know what documents and status mean",
        journey: ["Claims", "Claim status demo", "Contact"],
      },
    ],
    features: [
      { id: "f1", title: "Plan hub", description: "Health, term, motor", priority: "must" },
      { id: "f2", title: "Quote entry", description: "Simple lead form mock", priority: "must" },
      { id: "f3", title: "Claims education", description: "Steps and documents", priority: "must" },
      { id: "f4", title: "Policy demo", description: "My policies mock", priority: "should" },
      { id: "f5", title: "Claim status demo", description: "Timeline mock", priority: "should" },
    ],
    trustCompliance: [
      "Insurance is subject to terms; product pages show disclaimer",
      "No fake IRDAI licence numbers — fictional brand",
      "Claims timelines are illustrative",
    ],
    assumptions: ["v1 is marketing + mocked policy/claims screens", "No real underwriting"],
    outOfScope: ["Live premium calculation APIs", "Insurer core systems"],
    researchedAt: new Date().toISOString(),
    researchSource: "scaffold:insurance",
  };
}

export function resumeScaffold(input: { brandName?: string }): ProductPlan {
  const brand = input.brandName || "ResumeLift";
  return {
    ...baseMeta({
      brandName: brand,
      tagline: "Update your resume and LinkedIn with clear, job-ready guidance",
      businessModel: "Career tools / resume updater product",
      businessModelDetail:
        "Job seekers improve resume and profile: guided sections, tips, templates, and export path — marketing site + authenticated workspace mock.",
      region: "India",
      audience: ["Students", "Early-career professionals", "Career switchers"],
      valueProp: "Step-by-step resume upgrade with examples, not blank templates only.",
      extensionId: "resume-career",
      appKind: "resume-career",
      summary: `${brand}: public marketing + resume workspace demo (sections, tips, export, LinkedIn checklist).`,
    }),
    publicPages: [
      {
        path: "home",
        title: "Home",
        purpose: "Promise and CTA Start free",
        sections: ["Hero", "How it works", "Before/after story", "Templates teaser", "CTA"],
        zone: "public",
      },
      {
        path: "features",
        title: "Features",
        purpose: "What the product does",
        sections: ["Section builder", "AI tips framing", "LinkedIn checklist", "Export"],
        zone: "public",
      },
      {
        path: "templates",
        title: "Templates",
        purpose: "Template gallery mock",
        sections: ["Fresh graduate", "Experienced", "Switch career"],
        zone: "public",
      },
      {
        path: "pricing",
        title: "Pricing",
        purpose: "Free vs paid framing",
        sections: ["Free tier", "Pro tier", "FAQ on pricing"],
        zone: "public",
      },
      {
        path: "workspace",
        title: "Resume workspace (demo)",
        purpose: "Authenticated builder mock",
        sections: ["Sections list", "Editor panel", "Tips sidebar", "Save state"],
        zone: "authenticated",
      },
      {
        path: "linkedin",
        title: "LinkedIn checklist (demo)",
        purpose: "Profile upgrade list",
        sections: ["Headline", "About", "Experience bullets", "Skills"],
        zone: "authenticated",
      },
      {
        path: "export",
        title: "Export (demo)",
        purpose: "Download path mock",
        sections: ["PDF option", "Preview", "Success state"],
        zone: "authenticated",
      },
      {
        path: "faq",
        title: "FAQ",
        purpose: "Common questions",
        sections: ["Privacy", "ATS", "Pricing"],
        zone: "public",
      },
      {
        path: "about",
        title: "About",
        purpose: "Why we built this",
        sections: ["Mission", "Who it's for"],
        zone: "public",
      },
      {
        path: "contact",
        title: "Contact",
        purpose: "Support",
        sections: ["Email", "WhatsApp optional"],
        zone: "public",
      },
    ],
    modules: [
      {
        id: "resume-editor",
        title: "Resume section editor",
        purpose: "Edit experience/education/skills",
        states: ["empty resume", "editing", "saved", "error"],
        behaviors: ["Add section", "Reorder", "Get tip"],
        zone: "authenticated",
      },
      {
        id: "export",
        title: "Export",
        purpose: "Generate downloadable resume",
        states: ["ready", "generating", "done"],
        behaviors: ["Choose format", "Download"],
        zone: "authenticated",
      },
    ],
    personas: [
      {
        name: "Final-year student",
        goal: "First professional resume",
        journey: ["Home", "Templates", "Workspace demo", "Export"],
      },
      {
        name: "Career switcher",
        goal: "Reframe experience for new field",
        journey: ["Features", "LinkedIn checklist", "Workspace"],
      },
    ],
    features: [
      { id: "f1", title: "Section builder", description: "Structured resume parts", priority: "must" },
      { id: "f2", title: "Tips panel", description: "Actionable bullet advice", priority: "must" },
      { id: "f3", title: "LinkedIn checklist", description: "Profile upgrades", priority: "must" },
      { id: "f4", title: "Export demo", description: "PDF path mock", priority: "must" },
      { id: "f5", title: "Templates", description: "Gallery", priority: "should" },
    ],
    trustCompliance: ["User content privacy note", "No fake placement guarantees"],
    assumptions: ["v1 is product marketing + workspace mock", "No real ATS scoring backend"],
    outOfScope: ["Job board integrations", "Paid gateway"],
    researchedAt: new Date().toISOString(),
    researchSource: "scaffold:resume-career",
  };
}

export function pickScaffold(
  appKind: string,
  prompt: string,
  brandName?: string,
  region?: string
): ProductPlan | null {
  const p = `${appKind} ${prompt}`.toLowerCase();
  if (/bank|fintech|neobank|wallet|upi|lending/.test(p)) {
    const sme = /sme|business|company|merchant|kyb/.test(p);
    return bankingScaffold({
      brandName,
      region,
      model: sme ? "sme" : /retail|consumer|personal/.test(p) ? "retail" : "neobank",
    });
  }
  if (/insur|policy|claim|premium|term life|health cover/.test(p)) {
    return insuranceScaffold({ brandName, region });
  }
  if (/resume|cv|linkedin|career|job seeker/.test(p)) {
    return resumeScaffold({ brandName });
  }
  return null;
}
