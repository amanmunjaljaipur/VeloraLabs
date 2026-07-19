/**
 * Research product plan after prompt + answers - ALWAYS before generation.
 * Uses scaffolds (banking/insurance/resume) + Grok enrichment.
 */

import { detectVerticalFromPrompt } from "@/lib/app-builder/detect-vertical";
import { pickScaffold } from "@/lib/app-builder/plan-scaffolds";
import type { ProductPlan } from "@/lib/app-builder/product-plan-types";
import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import type { AppInterviewAnswer, AppLlmSecrets } from "@/lib/app-builder/types";
import { ensureVerticalResearched } from "@/lib/app-builder/vertical-research";

function answerMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]).filter(([, v]) => v));
}

function genericScaffold(prompt: string, brandName: string, appKind: string, extensionId: string): ProductPlan {
  return {
    version: 1,
    brandName,
    tagline: prompt.slice(0, 100),
    businessModel: "Custom digital product",
    businessModelDetail: `Built from user idea: ${prompt.slice(0, 280)}`,
    region: "India",
    audience: ["Primary users of this product"],
    valueProp: prompt.slice(0, 160),
    extensionId,
    appKind,
    summary: `Product site for ${brandName} with public marketing pages and key functional modules (demo where needed).`,
    publicPages: [
      {
        path: "home",
        title: "Home",
        purpose: "Value prop and primary CTA",
        sections: ["Hero", "Benefits", "How it works", "CTA"],
        zone: "public",
      },
      {
        path: "features",
        title: "Features",
        purpose: "What the product does",
        sections: ["Feature grid", "Details"],
        zone: "public",
      },
      {
        path: "how-it-works",
        title: "How it works",
        purpose: "Steps",
        sections: ["Step 1–3", "CTA"],
        zone: "public",
      },
      {
        path: "pricing",
        title: "Pricing",
        purpose: "Plans if relevant",
        sections: ["Free", "Paid", "FAQ"],
        zone: "public",
      },
      {
        path: "app",
        title: "Product demo",
        purpose: "Authenticated or core tool mock",
        sections: ["Main workspace", "Empty/loading/success states"],
        zone: "authenticated",
      },
      {
        path: "about",
        title: "About",
        purpose: "Story",
        sections: ["Mission", "Who for"],
        zone: "public",
      },
      {
        path: "faq",
        title: "FAQ",
        purpose: "Objections",
        sections: ["Common questions"],
        zone: "public",
      },
      {
        path: "contact",
        title: "Contact",
        purpose: "Reach human",
        sections: ["Email", "Phone"],
        zone: "public",
      },
    ],
    modules: [
      {
        id: "core",
        title: "Core product flow",
        purpose: "Main user job",
        states: ["empty", "loading", "success", "error"],
        behaviors: ["Primary action", "Save", "Continue"],
        zone: "authenticated",
      },
    ],
    personas: [
      {
        name: "Primary user",
        goal: "Complete the main job of the product",
        journey: ["Land", "Learn", "Try demo", "Contact"],
      },
    ],
    features: [
      { id: "f1", title: "Clear homepage", description: "Value and CTA", priority: "must" },
      { id: "f2", title: "Feature explanation", description: "What you get", priority: "must" },
      { id: "f3", title: "Core demo screen", description: "Functional mock", priority: "must" },
      { id: "f4", title: "FAQ + contact", description: "Trust and support", priority: "must" },
    ],
    trustCompliance: ["Honest scope - demo where not live", "No fake regulatory claims"],
    assumptions: ["v1 is clickable prototype with mocked data where needed"],
    outOfScope: ["Full production backend", "Native apps"],
    researchedAt: new Date().toISOString(),
    researchSource: "scaffold:generic",
  };
}

function mergePlans(base: ProductPlan, over: Partial<ProductPlan>): ProductPlan {
  return {
    ...base,
    ...over,
    version: 1,
    publicPages:
      Array.isArray(over.publicPages) && over.publicPages.length >= 4
        ? over.publicPages
        : base.publicPages,
    modules:
      Array.isArray(over.modules) && over.modules.length >= 1 ? over.modules : base.modules,
    personas:
      Array.isArray(over.personas) && over.personas.length >= 1 ? over.personas : base.personas,
    features:
      Array.isArray(over.features) && over.features.length >= 3 ? over.features : base.features,
    trustCompliance:
      Array.isArray(over.trustCompliance) && over.trustCompliance.length
        ? over.trustCompliance
        : base.trustCompliance,
    assumptions: Array.isArray(over.assumptions) ? over.assumptions : base.assumptions,
    outOfScope: Array.isArray(over.outOfScope) ? over.outOfScope : base.outOfScope,
    audience: Array.isArray(over.audience) && over.audience.length ? over.audience : base.audience,
    researchedAt: new Date().toISOString(),
  };
}

/**
 * Research + produce a product plan the user must approve before generation.
 */
export async function researchProductPlan(input: {
  prompt: string;
  answers?: AppInterviewAnswer[];
  customPoints?: string[];
  secrets?: AppLlmSecrets | null;
}): Promise<{ plan: ProductPlan; source: string }> {
  const prompt = input.prompt.trim();
  const a = answerMap(input.answers || []);
  const detected = detectVerticalFromPrompt(prompt);
  const brand =
    a.brandName ||
    a.name ||
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &-]{2,40})/i)?.[1] ||
    undefined;
  const region = a.city || a.region || "India";

  let base =
    pickScaffold(detected.appKind, prompt, brand, region) ||
    genericScaffold(
      prompt,
      brand || detected.label.slice(0, 40),
      detected.appKind,
      detected.extensionId
    );

  // Apply answer overrides lightly
  if (a.brandName) base = { ...base, brandName: a.brandName };
  if (a.mainJob || a.problemSolved) {
    base = {
      ...base,
      valueProp: (a.mainJob || a.problemSolved).slice(0, 200),
      tagline: (a.mainJob || a.problemSolved).slice(0, 100),
    };
  }
  if (a.whoFor) {
    base = {
      ...base,
      audience: a.whoFor.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean),
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : resolveAppBuilderSecrets();

  // Call vertical research agent to scan and extract competitor/workflow insights via xAI Grok
  let researchPackStr = "";
  try {
    const res = await ensureVerticalResearched({
      verticalId: detected.extensionId,
      label: detected.label,
      ideaPrompt: prompt,
    });
    if (res?.pack) {
      researchPackStr = `
Based on Grok Vertical Research:
- Reference Competitors/Leaders: ${JSON.stringify(res.pack.leaders)}
- Visitor workflows: ${JSON.stringify(res.pack.visitorJobs)}
- Owner workflows: ${JSON.stringify(res.pack.ownerJobs)}
- Suggested public pages: ${JSON.stringify(res.pack.publicPages)}
- Suggested admin menus: ${JSON.stringify(res.pack.adminMenus)}
- Typical communication channels: ${JSON.stringify(res.pack.channels)}
- Typical payment methods: ${JSON.stringify(res.pack.paymentNorms)}
- Suggested user roles: ${JSON.stringify(res.pack.roles)}
- Premium features: ${JSON.stringify(res.pack.premiumization)}
- Strategic risks to mitigate: ${JSON.stringify(res.pack.risks)}
`;
    }
  } catch (err) {
    console.warn("Grok vertical research failed, using heuristic scaffold", err);
  }

  if (!secrets) {
    return {
      plan: {
        ...base,
        researchSource: `${base.researchSource}+no-llm`,
        summary: `${base.summary} (Plan from research scaffolds - approve to build.)${researchPackStr ? `\n\nResearch insights applied:\n${researchPackStr}` : ""}`,
      },
      source: "scaffold",
    };
  }

  try {
    const qa = (input.answers || [])
      .filter((x) => x.answer?.trim())
      .map((x) => `Q: ${x.question}\nA: ${x.answer}`)
      .join("\n\n");
    const raw = await callUserLlm({
      secrets,
      temperature: 0.35,
      maxTokens: 4500,
      timeoutMs: 75_000,
      messages: [
        {
          role: "system",
          content: `You are a senior product researcher for digital products (banks, insurance, resume tools, SaaS, shops).
You output a COMPLETE product plan JSON before any UI is built.

Encode THREE layers:
1) business model (retail bank vs SME vs neobank, insurance type, etc.)
2) information architecture (public pages AND authenticated modules when relevant)
3) functional modules (what each screen does, with states: empty/loading/error/success)

For digital banking always include public marketing pages AND dashboard modules (accounts, transactions, payments with review-2FA, cards, statements, profile) even if user answers are thin.
For insurance: plans, quote, claims, policy demo.
For resume: workspace, tips, export, LinkedIn checklist.
Never return a hollow 3-page brochure.

Return ONLY JSON matching ProductPlan fields:
brandName, tagline, businessModel, businessModelDetail, region, audience[], valueProp,
extensionId, appKind, summary,
publicPages[{path,title,purpose,sections[],zone}],
modules[{id,title,purpose,states[],behaviors[],zone}],
personas[{name,goal,journey[]}],
features[{id,title,description,priority}],
trustCompliance[], assumptions[], outOfScope[]

zone is "public" or "authenticated". priority is must|should|could.
Keep 12–20 publicPages+auth pages for banking-like products; 8–14 for simpler tools.
Class-8 English for summary and titles.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            prompt,
            answers: qa || "(user skipped most questions - still produce a FULL complete plan from the idea)",
            customPoints: input.customPoints || [],
            detected: { extensionId: detected.extensionId, appKind: detected.appKind, label: detected.label },
            scaffoldHint: {
              brandName: base.brandName,
              businessModel: base.businessModel,
              pageCount: base.publicPages.length,
              moduleCount: base.modules.length,
            },
            researchNotes: researchPackStr,
            task: "Enrich or rewrite the plan so it is complete and ready for user approval before generation. Prefer more pages/modules over fewer. Use the researchNotes (roles, workflows, competitors, jobs) to structure the pages, roles, and modules properly.",
          }),
        },
      ],
    });

    const parsed = parseJsonObject<Partial<ProductPlan>>(raw);
    const plan = mergePlans(base, {
      ...parsed,
      brandName: parsed.brandName || base.brandName,
      extensionId: parsed.extensionId || base.extensionId,
      appKind: parsed.appKind || base.appKind,
      researchSource: "llm+scaffold",
    });
    return { plan, source: "llm+scaffold" };
  } catch (e) {
    console.error("[research-plan]", e);
    return {
      plan: {
        ...base,
        researchSource: `${base.researchSource}+llm-fallback`,
        summary: `${base.summary} (Using full scaffold - still complete enough to build.)`,
      },
      source: "scaffold-fallback",
    };
  }
}
