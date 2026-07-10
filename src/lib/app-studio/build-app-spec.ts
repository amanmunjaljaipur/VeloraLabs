/**
 * Rewrite free-text idea → full interactive app spec (roles, workflows, screens, seed data).
 * LLM when available; strong domain heuristics as fallback so apps always work.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import type { AppLlmSecrets } from "@/lib/app-builder/types";
import type {
  StudioAppSpec,
  StudioEntity,
  StudioResearchPack,
  StudioRole,
  StudioScreen,
  StudioWorkflow,
} from "@/lib/app-studio/types";
import { listEnvSecrets } from "@/lib/app-studio/generate";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Prefer request key, else env chain (Groq first). */
function secretsList(override?: AppLlmSecrets | null): AppLlmSecrets[] {
  if (override?.apiKey?.trim()) return [override];
  return listEnvSecrets();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|rate limit|tokens per minute|tpm|too many requests/i.test(msg);
}

async function callLlmJsonOnce(
  secrets: AppLlmSecrets,
  system: string,
  user: string
): Promise<string> {
  const base = (secrets.baseUrl || "").toLowerCase();
  if (base.includes("generativelanguage.googleapis.com") || base.includes("gemini")) {
    const model = (secrets.model || "gemini-2.0-flash").replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(secrets.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": secrets.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  }
  if (base.includes("anthropic.com")) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": secrets.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: secrets.model || "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return data.content?.find((c) => c.type === "text")?.text || "";
  }
  return callUserLlm({
    secrets,
    temperature: 0.3,
    maxTokens: 4000,
    timeoutMs: 90_000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
}

/** Groq free tier often 429s — retry with backoff so expand still succeeds. */
async function callLlmJson(
  secrets: AppLlmSecrets,
  system: string,
  user: string
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await callLlmJsonOnce(secrets, system, user);
    } catch (e) {
      lastErr = e;
      if (isRateLimitError(e) && attempt < 3) {
        const waitMs = 8_000 * (attempt + 1);
        console.warn(`[app-studio/expand] rate limited, retry in ${waitMs}ms (attempt ${attempt + 1})`);
        await sleep(waitMs);
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

const EXPAND_SYSTEM = `You are a product architect. Your job is NOT a landing page.
Rewrite a short product idea into a COMPLETE interactive operational web app.

First expand rewrittenPrompt (2-4 paragraphs) covering: all users/roles, every core workflow with steps, every screen, data entities, and success criteria (create records, change status, role-switch changes nav).

Return ONLY JSON (no markdown):
{
  "rewrittenPrompt": "full product brief",
  "brandName": "string",
  "tagline": "string",
  "description": "string",
  "roles": [{"id":"kebab","label":"string","description":"string","canCreate":true,"canManage":false,"isDefault":true}],
  "entities": [{
    "id":"kebab",
    "name":"Item",
    "namePlural":"Items",
    "statuses":["New","In progress","Done"],
    "fields":[{"key":"title","label":"Title","type":"text","required":true},{"key":"status","label":"Status","type":"status"}],
    "seed":[{"title":"Example 1","status":"New"},{"title":"Example 2","status":"In progress"},{"title":"Example 3","status":"Done"},{"title":"Example 4","status":"New"}]
  }],
  "screens": [{"id":"kebab","title":"string","type":"dashboard|list|form|board|schedule|settings","roleIds":["role-id"],"entityId":"optional","description":"string"}],
  "workflows": [{"id":"kebab","name":"string","description":"string","roleId":"role-id","steps":["step1","step2"],"screenId":"screen-id","entityId":"optional"}]
}

HARD RULES:
- At least 2 roles (e.g. customer + staff, employee + manager). Exactly one isDefault:true.
- At least 1 entity with 4+ realistic seed records. Include status when work has stages.
- Screens: role dashboards, list and/or board for primary entity, form to create, settings for admin-like roles.
- roleIds [] = all roles see the screen. Otherwise only listed roles.
- Every role has ≥1 workflow; each workflow.screenId must exist; workflow.roleId must match a role.
- Field types: text|textarea|number|date|select|status|email|phone
- NEVER a marketing brochure, pricing page, or waitlist-only shell. Always operational (book, create, approve, move pipeline).`;

export async function expandAndBuildAppSpec(input: {
  prompt: string;
  research?: StudioResearchPack | null;
  secrets?: AppLlmSecrets | null;
}): Promise<{ appSpec: StudioAppSpec; research: StudioResearchPack }> {
  const baseHeuristic = heuristicAppSpec(input.prompt, input.research);
  const list = secretsList(input.secrets);

  if (list.length) {
    for (const secrets of list) {
      try {
        const raw = await callLlmJson(
          secrets,
          EXPAND_SYSTEM,
          JSON.stringify({
            idea: input.prompt,
            research: input.research,
            task: "Rewrite the idea into a full multi-role interactive app blueprint JSON.",
          })
        );
        const parsed = parseJsonObject<Partial<StudioAppSpec> & { rewrittenPrompt?: string }>(raw);
        const appSpec = normalizeAppSpec(parsed, input.prompt, input.research);
        if (appSpec.roles.length >= 2 && appSpec.screens.length >= 3 && appSpec.entities.length >= 1) {
          const research: StudioResearchPack = {
            ...(input.research || emptyResearch(input.prompt)),
            summary: appSpec.description || input.research?.summary || input.prompt,
            rewrittenPrompt: appSpec.rewrittenPrompt,
            targetUsers: appSpec.roles.map((r) => r.label),
            screens: appSpec.screens.map((s) => s.title),
            coreWorkflows: appSpec.workflows.map((w) => ({
              name: w.name,
              steps: w.steps,
            })),
            dataEntities: appSpec.entities.map((e) => e.name),
          };
          return { appSpec: { ...appSpec, research }, research };
        }
      } catch (e) {
        console.warn("[app-studio/expand] provider failed", e);
      }
    }
  }

  const research: StudioResearchPack = {
    ...(input.research || emptyResearch(input.prompt)),
    rewrittenPrompt: baseHeuristic.rewrittenPrompt,
    summary: baseHeuristic.description,
    targetUsers: baseHeuristic.roles.map((r) => r.label),
    screens: baseHeuristic.screens.map((s) => s.title),
    coreWorkflows: baseHeuristic.workflows.map((w) => ({ name: w.name, steps: w.steps })),
    dataEntities: baseHeuristic.entities.map((e) => e.name),
  };
  return { appSpec: { ...baseHeuristic, research }, research };
}

function emptyResearch(prompt: string): StudioResearchPack {
  return {
    summary: prompt,
    targetUsers: [],
    coreWorkflows: [],
    screens: [],
    dataEntities: [],
    techNotes: [],
    competitors: [],
  };
}

function composeRewrittenPrompt(parts: {
  brandName: string;
  description: string;
  roles: StudioRole[];
  workflows: StudioWorkflow[];
  screens: StudioScreen[];
  entities: StudioEntity[];
  fallback: string;
}): string {
  const body = `Build a complete multi-role working product named ${parts.brandName} — not a marketing site.

${parts.description}

ROLES
${parts.roles.map((r, i) => `${i + 1}) ${r.label} — ${r.description}`).join("\n")}

WORKFLOWS
${parts.workflows
  .map((w) => `- ${w.name} (${w.roleId}): ${w.steps.join(" → ")}`)
  .join("\n")}

SCREENS
${parts.screens.map((s) => s.title).join(", ")}.

DATA
${parts.entities.map((e) => `${e.name} (${e.fields.map((f) => f.key).join(", ")})`).join("; ")}.

SUCCESS
Role selector top-right switches nav and workflows. Creating records and moving board statuses update the app immediately.`;

  if (parts.fallback && parts.fallback.length > body.length) {
    return parts.fallback;
  }
  return body;
}

function normalizeAppSpec(
  raw: Partial<StudioAppSpec> & { rewrittenPrompt?: string },
  prompt: string,
  research?: StudioResearchPack | null
): StudioAppSpec {
  const fallback = heuristicAppSpec(prompt, research);
  const roles = Array.isArray(raw.roles) && raw.roles.length >= 1 ? raw.roles : fallback.roles;
  const entities =
    Array.isArray(raw.entities) && raw.entities.length >= 1 ? raw.entities : fallback.entities;
  const screens =
    Array.isArray(raw.screens) && raw.screens.length >= 2 ? raw.screens : fallback.screens;
  const workflows =
    Array.isArray(raw.workflows) && raw.workflows.length >= 1
      ? raw.workflows
      : fallback.workflows;

  // Ensure every role has isDefault exactly once
  const hasDefault = roles.some((r) => r.isDefault);
  const fixedRoles = roles.map((r, i) => ({
    ...r,
    id: r.id || `role-${i}`,
    isDefault: hasDefault ? Boolean(r.isDefault) : i === 0,
    canCreate: r.canCreate !== false,
    canManage: Boolean(r.canManage),
  }));

  // Exactly one default if LLM set multiple
  let sawDefault = false;
  const uniqueDefaultRoles = fixedRoles.map((r) => {
    if (r.isDefault) {
      if (sawDefault) return { ...r, isDefault: false };
      sawDefault = true;
      return r;
    }
    return r;
  });
  if (!sawDefault && uniqueDefaultRoles[0]) uniqueDefaultRoles[0].isDefault = true;

  const fixedScreens = screens.map((s, i) => ({
    ...s,
    id: s.id || `screen-${i}`,
    roleIds: Array.isArray(s.roleIds) ? s.roleIds : [],
    type: (s.type || "list") as StudioScreen["type"],
  }));
  const screenIds = new Set(fixedScreens.map((s) => s.id));

  const fixedEntities = entities.map((e, i) => {
    const seed =
      e.seed?.length && e.seed.length >= 2
        ? e.seed
        : fallback.entities[i]?.seed ||
          fallback.entities[0]?.seed || [
            { title: "Sample A", status: "New" },
            { title: "Sample B", status: "In progress" },
            { title: "Sample C", status: "Done" },
          ];
    return {
      ...e,
      id: e.id || `entity-${i}`,
      namePlural: e.namePlural || `${e.name}s`,
      fields: e.fields?.length
        ? e.fields
        : [
            { key: "title", label: "Title", type: "text" as const, required: true },
            { key: "status", label: "Status", type: "status" as const },
          ],
      statuses: e.statuses?.length ? e.statuses : ["New", "In progress", "Done"],
      seed,
    };
  });

  const fixedWorkflows = workflows.map((w, i) => {
    const roleId =
      uniqueDefaultRoles.some((r) => r.id === w.roleId)
        ? w.roleId
        : uniqueDefaultRoles[i % uniqueDefaultRoles.length]?.id || "member";
    const screenId = screenIds.has(w.screenId)
      ? w.screenId
      : fixedScreens[Math.min(i, fixedScreens.length - 1)]?.id || fixedScreens[0]?.id || "dash";
    return {
      ...w,
      id: w.id || `wf-${i}`,
      roleId,
      screenId,
      steps: w.steps?.length ? w.steps : ["Open", "Act", "Done"],
    };
  });

  // Every role needs ≥1 workflow
  for (const role of uniqueDefaultRoles) {
    if (!fixedWorkflows.some((w) => w.roleId === role.id)) {
      const screen =
        fixedScreens.find((s) => !s.roleIds.length || s.roleIds.includes(role.id)) ||
        fixedScreens[0];
      fixedWorkflows.push({
        id: `wf-auto-${role.id}`,
        name: `${role.label} path`,
        description: role.description,
        roleId: role.id,
        steps: ["Open app", "Use main screen", "Complete action"],
        screenId: screen?.id || "dash",
      });
    }
  }

  const brandName = raw.brandName || fallback.brandName;
  const description = raw.description || fallback.description;
  const rawBrief = (raw.rewrittenPrompt || "").trim();
  const rewrittenPrompt =
    rawBrief.length >= 120
      ? rawBrief
      : composeRewrittenPrompt({
          brandName,
          description,
          roles: uniqueDefaultRoles,
          workflows: fixedWorkflows,
          screens: fixedScreens,
          entities: fixedEntities,
          fallback: fallback.rewrittenPrompt,
        });

  return {
    version: 1,
    brandName,
    tagline: raw.tagline || fallback.tagline,
    description,
    rewrittenPrompt,
    primaryColor: raw.primaryColor || "#0f2744",
    accentColor: raw.accentColor || "#0d9488",
    roles: uniqueDefaultRoles,
    entities: fixedEntities,
    screens: fixedScreens,
    workflows: fixedWorkflows,
  };
}

/** Sync heuristic blueprint — used by expand fallback and live-app auto-upgrade. */
export function buildHeuristicAppSpec(
  prompt: string,
  research?: StudioResearchPack | null,
  hints?: { extensionId?: string; slug?: string; name?: string }
): StudioAppSpec {
  return heuristicAppSpec(prompt, research, hints);
}

function heuristicAppSpec(
  prompt: string,
  research?: StudioResearchPack | null,
  hints?: { extensionId?: string; slug?: string; name?: string }
): StudioAppSpec {
  const p = `${prompt} ${hints?.extensionId || ""} ${hints?.slug || ""} ${hints?.name || ""}`.toLowerCase();
  if (
    hints?.extensionId === "digital-banking" ||
    /\bbank|neobank|fintech|wallet|upi|transfer money|digital.?bank|verlin.?bank|horizon bank\b/.test(
      p
    )
  ) {
    return bankingSpec(prompt, research, hints?.name);
  }
  if (
    hints?.extensionId === "resume-career" ||
    /\bresume|cv\b|linkedin|career|job.?seek|cover.?letter|resumelift\b/.test(p)
  ) {
    return resumeSpec(prompt, research);
  }
  if (
    hints?.extensionId === "booking-local" ||
    /\byoga|class|studio|booking|appointment|salon|spa|clinic\b/.test(p)
  ) {
    return yogaSpec(prompt, research);
  }
  if (/\bexpense|claim|receipt|reimburse|finance|budget\b/.test(p)) {
    return expenseSpec(prompt, research);
  }
  if (/\bcrm|lead|sales|pipeline|deal\b/.test(p)) {
    return crmSpec(prompt, research);
  }
  if (/\btask|kanban|board|todo|project|team\b/.test(p)) {
    return taskBoardSpec(prompt, research);
  }
  // Default: multi-role ops board (never a marketing shell)
  return taskBoardSpec(prompt, research);
}

function bankingSpec(
  prompt: string,
  research?: StudioResearchPack | null,
  preferredName?: string
): StudioAppSpec {
  const brand =
    preferredName ||
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &'-]{2,40})/i)?.[1] ||
    (/\bverlin\b/i.test(prompt) ? "Verlin Bank" : null) ||
    "Horizon Bank";
  const roles: StudioRole[] = [
    {
      id: "customer",
      label: "Customer",
      description: "See balances, send money, freeze cards, view transactions",
      canCreate: true,
      canManage: true,
      isDefault: true,
    },
    {
      id: "support",
      label: "Support agent",
      description: "Handle customer cases and payment disputes",
      canCreate: true,
      canManage: true,
    },
    {
      id: "ops",
      label: "Bank ops",
      description: "Review transfers, cards, and risk flags across all customers",
      canCreate: true,
      canManage: true,
    },
  ];
  const entities: StudioEntity[] = [
    {
      id: "account",
      name: "Account",
      namePlural: "Accounts",
      statuses: ["Active", "Frozen", "Closed"],
      fields: [
        { key: "title", label: "Account name", type: "text", required: true },
        {
          key: "level",
          label: "Type",
          type: "select",
          options: ["Savings", "Current", "Wallet"],
        },
        { key: "amount", label: "Balance (₹)", type: "number", required: true },
        { key: "memberName", label: "Holder", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Everyday Savings",
          level: "Savings",
          amount: 84250,
          memberName: "You",
          status: "Active",
        },
        {
          title: "Salary Current",
          level: "Current",
          amount: 126400,
          memberName: "You",
          status: "Active",
        },
        {
          title: "UPI Wallet",
          level: "Wallet",
          amount: 2340,
          memberName: "You",
          status: "Active",
        },
        {
          title: "Emergency Fund",
          level: "Savings",
          amount: 50000,
          memberName: "You",
          status: "Frozen",
        },
      ],
    },
    {
      id: "transfer",
      name: "Transfer",
      namePlural: "Transfers",
      statuses: ["Pending", "2FA", "Completed", "Failed"],
      fields: [
        { key: "title", label: "Payee", type: "text", required: true },
        { key: "amount", label: "Amount (₹)", type: "number", required: true },
        { key: "description", label: "Reference / note", type: "textarea" },
        {
          key: "plan",
          label: "From account",
          type: "select",
          options: ["Everyday Savings", "Salary Current", "UPI Wallet"],
        },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Asha Sharma (UPI)",
          amount: 1500,
          description: "Dinner split",
          plan: "UPI Wallet",
          status: "Completed",
        },
        {
          title: "BESCOM bill",
          amount: 2200,
          description: "Electricity Mar",
          plan: "Salary Current",
          status: "Completed",
        },
        {
          title: "Rohan Mehta",
          amount: 25000,
          description: "Rent",
          plan: "Salary Current",
          status: "Pending",
        },
        {
          title: "Unknown UPI",
          amount: 9000,
          description: "Flagged for review",
          plan: "Everyday Savings",
          status: "2FA",
        },
      ],
    },
    {
      id: "card",
      name: "Card",
      namePlural: "Cards",
      statuses: ["Active", "Frozen", "Blocked"],
      fields: [
        { key: "title", label: "Card", type: "text", required: true },
        {
          key: "level",
          label: "Type",
          type: "select",
          options: ["Debit", "Virtual", "Credit"],
        },
        { key: "amount", label: "Spend limit (₹)", type: "number" },
        { key: "description", label: "Last 4 / note", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Primary debit",
          level: "Debit",
          amount: 50000,
          description: "•••• 4821",
          status: "Active",
        },
        {
          title: "Online virtual",
          level: "Virtual",
          amount: 15000,
          description: "•••• 9033",
          status: "Active",
        },
        {
          title: "Travel card",
          level: "Debit",
          amount: 20000,
          description: "•••• 1102",
          status: "Frozen",
        },
      ],
    },
    {
      id: "case",
      name: "Support case",
      namePlural: "Support cases",
      statuses: ["Open", "In progress", "Resolved"],
      fields: [
        { key: "title", label: "Subject", type: "text", required: true },
        { key: "memberName", label: "Customer", type: "text" },
        { key: "description", label: "Details", type: "textarea" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Card not working overseas",
          memberName: "Priya S.",
          description: "Declined in Singapore",
          status: "Open",
        },
        {
          title: "Transfer stuck Pending",
          memberName: "Arjun K.",
          description: "Rent transfer 25k",
          status: "In progress",
        },
        {
          title: "Limit increase request",
          memberName: "Meera R.",
          description: "Virtual card limit",
          status: "Resolved",
        },
      ],
    },
  ];
  const screens: StudioScreen[] = [
    {
      id: "cust-home",
      title: "Home",
      type: "dashboard",
      roleIds: ["customer"],
      description: "Balances and quick actions",
    },
    {
      id: "accounts",
      title: "Accounts",
      type: "list",
      roleIds: ["customer", "ops"],
      entityId: "account",
    },
    {
      id: "transfer",
      title: "Send money",
      type: "form",
      roleIds: ["customer"],
      entityId: "transfer",
    },
    {
      id: "transfers",
      title: "My transfers",
      type: "list",
      roleIds: ["customer"],
      entityId: "transfer",
    },
    {
      id: "cards",
      title: "Cards",
      type: "board",
      roleIds: ["customer", "ops"],
      entityId: "card",
    },
    {
      id: "support-home",
      title: "Agent home",
      type: "dashboard",
      roleIds: ["support"],
    },
    {
      id: "cases",
      title: "Cases",
      type: "board",
      roleIds: ["support", "ops"],
      entityId: "case",
    },
    {
      id: "ops-home",
      title: "Ops home",
      type: "dashboard",
      roleIds: ["ops"],
    },
    {
      id: "ops-transfers",
      title: "All transfers",
      type: "board",
      roleIds: ["ops", "support"],
      entityId: "transfer",
    },
    {
      id: "settings",
      title: "Security & settings",
      type: "settings",
      roleIds: ["customer", "ops"],
    },
  ];
  const workflows: StudioWorkflow[] = [
    {
      id: "wf-pay",
      name: "Send money",
      description: "Customer pays someone: form → Pending/2FA → Completed",
      roleId: "customer",
      steps: [
        "Open Send money",
        "Enter payee + amount",
        "Submit (Pending)",
        "Confirm 2FA on board/list",
        "See Completed",
      ],
      screenId: "transfer",
      entityId: "transfer",
    },
    {
      id: "wf-freeze",
      name: "Freeze a card",
      description: "Customer freezes a lost/stolen card on the cards board",
      roleId: "customer",
      steps: ["Open Cards", "Find card", "Move to Frozen", "Optional raise support case"],
      screenId: "cards",
      entityId: "card",
    },
    {
      id: "wf-case",
      name: "Resolve a case",
      description: "Support agent works Open → In progress → Resolved",
      roleId: "support",
      steps: ["Open Cases board", "Pick Open case", "Move In progress", "Resolve"],
      screenId: "cases",
      entityId: "case",
    },
    {
      id: "wf-ops",
      name: "Review risky transfers",
      description: "Ops clears Pending/2FA transfers or marks Failed",
      roleId: "ops",
      steps: ["Open All transfers", "Review 2FA/Pending", "Complete or Fail"],
      screenId: "ops-transfers",
      entityId: "transfer",
    },
  ];
  return {
    version: 1,
    brandName: brand,
    tagline: "Accounts · pay · cards · support",
    description:
      research?.summary ||
      `${brand}: customers manage accounts and transfers; support handles cases; ops reviews payments and cards. Demo only — no real money movement.`,
    rewrittenPrompt: `Build a COMPLETE multi-role digital banking product named ${brand} — NOT a marketing website.

ROLES
1) Customer — home dashboard with account counts, list accounts, send money form, my transfers, freeze cards board, security settings.
2) Support agent — cases board (Open / In progress / Resolved).
3) Bank ops — all transfers board, cards, accounts overview.

WORKFLOWS
- Send money: form → Pending → 2FA → Completed/Failed.
- Freeze card: cards board Active → Frozen.
- Support case: Open → In progress → Resolved.
- Ops review: clear Pending/2FA transfers.

SCREENS
Customer Home, Accounts, Send money, My transfers, Cards, Agent home, Cases, Ops home, All transfers, Security settings.

DATA with seed India-style amounts in ₹. Label as demo / fictional bank.

SUCCESS
Role selector top-right changes nav. Creating a transfer updates lists. Moving board cards changes status. Never a brochure with only highlights.`,
    primaryColor: "#0b1f3a",
    accentColor: "#0d9488",
    roles,
    entities,
    screens,
    workflows,
    research: research || undefined,
  };
}

function resumeSpec(prompt: string, research?: StudioResearchPack | null): StudioAppSpec {
  const brand =
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &'-]{2,40})/i)?.[1] ||
    (/\bresumelift\b/i.test(prompt) ? "ResumeLift" : null) ||
    "ResumeLift";
  const roles: StudioRole[] = [
    {
      id: "seeker",
      label: "Job seeker",
      description: "Builds resume sections, applies tips, tracks LinkedIn checklist, exports",
      canCreate: true,
      canManage: false,
      isDefault: true,
    },
    {
      id: "coach",
      label: "Career coach",
      description: "Reviews client resumes, adds feedback, advances review status",
      canCreate: true,
      canManage: true,
    },
    {
      id: "admin",
      label: "Product admin",
      description: "Sees all resumes and exports; manages pipeline",
      canCreate: true,
      canManage: true,
    },
  ];
  const entities: StudioEntity[] = [
    {
      id: "resume",
      name: "Resume",
      namePlural: "Resumes",
      statuses: ["Draft", "In review", "Ready", "Exported"],
      fields: [
        { key: "title", label: "Target role", type: "text", required: true },
        { key: "memberName", label: "Candidate", type: "text", required: true },
        {
          key: "level",
          label: "Level",
          type: "select",
          options: ["Student", "Early career", "Experienced", "Career switch"],
        },
        { key: "description", label: "Summary / headline", type: "textarea" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Frontend Engineer",
          memberName: "Priya S.",
          level: "Early career",
          description: "React + TypeScript · 2 years",
          status: "Draft",
        },
        {
          title: "Product Manager",
          memberName: "Arjun K.",
          level: "Experienced",
          description: "B2B SaaS · 5 years",
          status: "In review",
        },
        {
          title: "Data Analyst",
          memberName: "Meera R.",
          level: "Career switch",
          description: "SQL + Python · bootcamp grad",
          status: "Ready",
        },
        {
          title: "Sales Associate",
          memberName: "You",
          level: "Student",
          description: "Campus placements · internship focus",
          status: "Draft",
        },
      ],
    },
    {
      id: "tip",
      name: "Tip",
      namePlural: "Tips",
      statuses: ["Open", "Applied", "Skipped"],
      fields: [
        { key: "title", label: "Tip", type: "text", required: true },
        { key: "description", label: "How to apply", type: "textarea" },
        {
          key: "category",
          label: "Section",
          type: "select",
          options: ["Summary", "Experience", "Skills", "LinkedIn", "Export"],
        },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Lead bullets with impact verbs",
          description: "Start with Built / Led / Reduced + a metric",
          category: "Experience",
          status: "Open",
        },
        {
          title: "Add 3 quantified wins",
          description: "%, time saved, or ₹ impact for each role",
          category: "Experience",
          status: "Open",
        },
        {
          title: "Match skills to JD keywords",
          description: "Mirror 5–8 terms from the job post",
          category: "Skills",
          status: "Applied",
        },
        {
          title: "Rewrite LinkedIn headline",
          description: "Role · superpower · audience, under 120 chars",
          category: "LinkedIn",
          status: "Open",
        },
      ],
    },
    {
      id: "checklist",
      name: "LinkedIn item",
      namePlural: "LinkedIn checklist",
      statuses: ["Todo", "Done"],
      fields: [
        { key: "title", label: "Item", type: "text", required: true },
        { key: "description", label: "Notes", type: "textarea" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        { title: "Photo + banner", description: "Clear headshot", status: "Done" },
        { title: "Headline", description: "Target role + value", status: "Todo" },
        { title: "About section", description: "3 short paragraphs", status: "Todo" },
        { title: "Featured work", description: "Link portfolio or case study", status: "Todo" },
      ],
    },
  ];
  const screens: StudioScreen[] = [
    {
      id: "seeker-home",
      title: "My dashboard",
      type: "dashboard",
      roleIds: ["seeker"],
      description: "Progress across resumes, tips, LinkedIn",
    },
    {
      id: "my-resumes",
      title: "My resumes",
      type: "list",
      roleIds: ["seeker"],
      entityId: "resume",
    },
    {
      id: "new-resume",
      title: "New resume",
      type: "form",
      roleIds: ["seeker", "coach", "admin"],
      entityId: "resume",
    },
    {
      id: "tips",
      title: "Tips board",
      type: "board",
      roleIds: ["seeker", "coach"],
      entityId: "tip",
    },
    {
      id: "linkedin",
      title: "LinkedIn checklist",
      type: "board",
      roleIds: ["seeker"],
      entityId: "checklist",
    },
    {
      id: "coach-queue",
      title: "Review queue",
      type: "board",
      roleIds: ["coach", "admin"],
      entityId: "resume",
    },
    {
      id: "all-resumes",
      title: "All resumes",
      type: "list",
      roleIds: ["admin"],
      entityId: "resume",
    },
    {
      id: "coach-home",
      title: "Coach dashboard",
      type: "dashboard",
      roleIds: ["coach"],
    },
    {
      id: "admin-home",
      title: "Admin dashboard",
      type: "dashboard",
      roleIds: ["admin"],
    },
    {
      id: "settings",
      title: "Settings",
      type: "settings",
      roleIds: ["admin"],
    },
  ];
  const workflows: StudioWorkflow[] = [
    {
      id: "wf-build",
      name: "Build a resume",
      description: "Seeker creates a resume and works tips until Ready",
      roleId: "seeker",
      steps: [
        "Open New resume",
        "Add target role + summary",
        "Apply tips on Tips board",
        "Complete LinkedIn checklist",
        "Move resume to Ready",
      ],
      screenId: "new-resume",
      entityId: "resume",
    },
    {
      id: "wf-linkedin",
      name: "Upgrade LinkedIn",
      description: "Tick profile checklist items",
      roleId: "seeker",
      steps: ["Open LinkedIn checklist", "Mark items Done", "Rewrite headline"],
      screenId: "linkedin",
      entityId: "checklist",
    },
    {
      id: "wf-coach",
      name: "Coach review",
      description: "Coach moves resumes In review → Ready and adds tips",
      roleId: "coach",
      steps: ["Open Review queue", "Read draft", "Add tip", "Set status Ready"],
      screenId: "coach-queue",
      entityId: "resume",
    },
    {
      id: "wf-admin",
      name: "Ops overview",
      description: "Admin monitors all resumes and statuses",
      roleId: "admin",
      steps: ["Open dashboard", "Scan all resumes", "Fix stuck Drafts"],
      screenId: "all-resumes",
      entityId: "resume",
    },
  ];
  return {
    version: 1,
    brandName: brand,
    tagline: "Build · tip · checklist · export",
    description:
      research?.summary ||
      `${brand}: job seekers build resumes with actionable tips and LinkedIn checklist; coaches review; admins see the full pipeline.`,
    rewrittenPrompt: `Build a complete multi-role career product named ${brand} — NOT a marketing site.

ROLES
1) Job seeker — create resumes, apply tips (Open → Applied), complete LinkedIn checklist, track status Draft → Ready → Exported.
2) Career coach — review queue board, change resume status, create tips for clients.
3) Product admin — all resumes list, dashboards, settings.

WORKFLOWS
- Build a resume: form → my resumes → tips board → LinkedIn checklist → Ready.
- Coach review: review queue board → status changes → tips.
- Admin ops: all resumes + status management.

SCREENS
Seeker dashboard, My resumes, New resume form, Tips board, LinkedIn checklist, Coach dashboard, Review queue, Admin dashboard, All resumes, Settings.

DATA
Resume (target role, candidate, level, summary, status). Tip (title, how-to, section, status). LinkedIn checklist items. Seed with realistic India job-seeker examples.

SUCCESS
Role selector top-right switches nav and workflows. Creating a resume updates lists immediately. Moving board cards changes status. Never a static brochure.`,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    roles,
    entities,
    screens,
    workflows,
    research: research || undefined,
  };
}

function yogaSpec(prompt: string, research?: StudioResearchPack | null): StudioAppSpec {
  const brand =
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &'-]{2,40})/i)?.[1] || "ZenFlow Studio";
  const roles: StudioRole[] = [
    {
      id: "member",
      label: "Member",
      description: "Books classes and manages own bookings",
      canCreate: true,
      canManage: false,
      isDefault: true,
    },
    {
      id: "instructor",
      label: "Instructor",
      description: "Sees assigned classes and attendance",
      canCreate: false,
      canManage: true,
    },
    {
      id: "owner",
      label: "Studio owner",
      description: "Manages schedule, capacity, and all bookings",
      canCreate: true,
      canManage: true,
    },
  ];
  const entities: StudioEntity[] = [
    {
      id: "class",
      name: "Class",
      namePlural: "Classes",
      statuses: ["Open", "Full", "Cancelled"],
      fields: [
        { key: "title", label: "Class name", type: "text", required: true },
        { key: "when", label: "When", type: "text", required: true },
        { key: "instructor", label: "Instructor", type: "text" },
        { key: "level", label: "Level", type: "select", options: ["Beginner", "All levels", "Advanced"] },
        { key: "spots", label: "Spots left", type: "number" },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          title: "Sunrise Vinyasa",
          when: "Today · 7:00 AM",
          instructor: "Asha",
          level: "All levels",
          spots: 4,
          status: "Open",
        },
        {
          title: "Power Flow",
          when: "Today · 6:30 PM",
          instructor: "Rohan",
          level: "Advanced",
          spots: 2,
          status: "Open",
        },
        {
          title: "Yin Restore",
          when: "Tomorrow · 8:00 AM",
          instructor: "Meera",
          level: "Beginner",
          spots: 8,
          status: "Open",
        },
        {
          title: "Prenatal Yoga",
          when: "Sat · 10:00 AM",
          instructor: "Asha",
          level: "All levels",
          spots: 5,
          status: "Open",
        },
      ],
    },
    {
      id: "booking",
      name: "Booking",
      namePlural: "Bookings",
      statuses: ["Confirmed", "Waitlist", "Cancelled"],
      fields: [
        { key: "memberName", label: "Member", type: "text", required: true },
        { key: "classTitle", label: "Class", type: "text", required: true },
        { key: "plan", label: "Plan", type: "select", options: ["Drop-in", "Membership", "Pack"] },
        { key: "status", label: "Status", type: "status" },
      ],
      seed: [
        {
          memberName: "Priya S.",
          classTitle: "Sunrise Vinyasa",
          plan: "Membership",
          status: "Confirmed",
        },
        {
          memberName: "Arjun K.",
          classTitle: "Power Flow",
          plan: "Drop-in",
          status: "Confirmed",
        },
      ],
    },
  ];
  const screens: StudioScreen[] = [
    {
      id: "member-home",
      title: "My dashboard",
      type: "dashboard",
      roleIds: ["member"],
      description: "Upcoming bookings and quick book",
    },
    {
      id: "schedule",
      title: "Class schedule",
      type: "schedule",
      roleIds: [],
      entityId: "class",
      description: "Browse and book classes",
    },
    {
      id: "book-form",
      title: "Book a class",
      type: "form",
      roleIds: ["member", "owner"],
      entityId: "booking",
    },
    {
      id: "my-bookings",
      title: "My bookings",
      type: "list",
      roleIds: ["member"],
      entityId: "booking",
    },
    {
      id: "instructor-roster",
      title: "My classes",
      type: "list",
      roleIds: ["instructor", "owner"],
      entityId: "class",
    },
    {
      id: "owner-board",
      title: "All bookings",
      type: "board",
      roleIds: ["owner"],
      entityId: "booking",
    },
    {
      id: "settings",
      title: "Settings",
      type: "settings",
      roleIds: ["owner"],
    },
  ];
  const workflows: StudioWorkflow[] = [
    {
      id: "wf-book",
      name: "Book a class",
      description: "Member picks a class and confirms booking",
      roleId: "member",
      steps: ["Open schedule", "Choose class", "Select plan", "Confirm", "See my bookings"],
      screenId: "schedule",
      entityId: "booking",
    },
    {
      id: "wf-teach",
      name: "Run a class",
      description: "Instructor reviews roster",
      roleId: "instructor",
      steps: ["Open my classes", "Check capacity", "Mark attendance"],
      screenId: "instructor-roster",
      entityId: "class",
    },
    {
      id: "wf-ops",
      name: "Manage studio",
      description: "Owner manages bookings board",
      roleId: "owner",
      steps: ["View all bookings", "Move status", "Add class slots"],
      screenId: "owner-board",
      entityId: "booking",
    },
  ];
  return {
    version: 1,
    brandName: brand,
    tagline: "Book classes · memberships · drop-ins",
    description:
      research?.summary ||
      `${brand}: members book yoga classes, instructors see rosters, owners manage the schedule.`,
    rewrittenPrompt: `Build a complete yoga studio booking product named ${brand}.

ROLES
1) Member — browse schedule, book with drop-in/membership/pack, view/cancel own bookings.
2) Instructor — see assigned classes and who is booked.
3) Owner — manage all classes and bookings board, change statuses, add slots.

WORKFLOWS
- Book a class: schedule → class detail → plan → confirm → my bookings.
- Instructor day: my classes → roster.
- Owner ops: bookings board → status changes (Confirmed / Waitlist / Cancelled).

SCREENS
Member dashboard, Class schedule, Book form, My bookings, Instructor classes, Owner bookings board, Settings.

DATA
Classes (title, when, instructor, level, spots, status). Bookings (member, class, plan, status) with seed data.

SUCCESS
Role selector switches the entire nav and data view. Creating a booking updates lists and boards immediately. Not a marketing site — an operational app.`,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    roles,
    entities,
    screens,
    workflows,
    research: research || undefined,
  };
}

function taskBoardSpec(prompt: string, research?: StudioResearchPack | null): StudioAppSpec {
  const brand =
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &'-]{2,40})/i)?.[1] || "FlowBoard";
  return {
    version: 1,
    brandName: brand,
    tagline: "Tasks · columns · team roles",
    description:
      research?.summary ||
      `${brand}: team task board with members who create tasks and managers who move status.`,
    rewrittenPrompt: `Interactive task board app ${brand}. Roles: Member (create tasks, see own work) and Manager (full board, reassign status). Screens: dashboard, board, new task form, my tasks list, settings. Entity Task with title, description, assignee, status (Todo/In progress/Done). Workflows: create task, move across board, review as manager.`,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    roles: [
      {
        id: "member",
        label: "Team member",
        description: "Creates and updates own tasks",
        canCreate: true,
        canManage: false,
        isDefault: true,
      },
      {
        id: "manager",
        label: "Manager",
        description: "Full board control and status changes",
        canCreate: true,
        canManage: true,
      },
    ],
    entities: [
      {
        id: "task",
        name: "Task",
        namePlural: "Tasks",
        statuses: ["Todo", "In progress", "Done"],
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "assignee", label: "Assignee", type: "text" },
          { key: "status", label: "Status", type: "status" },
        ],
        seed: [
          { title: "Design landing", description: "Hero + CTA", assignee: "You", status: "Todo" },
          {
            title: "API auth",
            description: "Login flow",
            assignee: "Dev",
            status: "In progress",
          },
          { title: "Ship MVP", description: "Release checklist", assignee: "PM", status: "Done" },
          {
            title: "Write FAQ",
            description: "Support copy",
            assignee: "You",
            status: "Todo",
          },
        ],
      },
    ],
    screens: [
      { id: "dash", title: "Dashboard", type: "dashboard", roleIds: [], description: "Counts by status" },
      { id: "board", title: "Board", type: "board", roleIds: [], entityId: "task" },
      { id: "new", title: "New task", type: "form", roleIds: ["member", "manager"], entityId: "task" },
      { id: "mine", title: "My tasks", type: "list", roleIds: ["member"], entityId: "task" },
      { id: "all", title: "All tasks", type: "list", roleIds: ["manager"], entityId: "task" },
      { id: "settings", title: "Settings", type: "settings", roleIds: ["manager"] },
    ],
    workflows: [
      {
        id: "wf-create",
        name: "Create task",
        description: "Add a task to the board",
        roleId: "member",
        steps: ["Open New task", "Fill title", "Save", "See on board"],
        screenId: "new",
        entityId: "task",
      },
      {
        id: "wf-move",
        name: "Move task status",
        description: "Manager advances work",
        roleId: "manager",
        steps: ["Open board", "Change status", "Done column"],
        screenId: "board",
        entityId: "task",
      },
    ],
    research: research || undefined,
  };
}

function expenseSpec(prompt: string, research?: StudioResearchPack | null): StudioAppSpec {
  const brand = "SpendLog";
  return {
    version: 1,
    brandName: brand,
    tagline: "Submit · approve · track expenses",
    description: research?.summary || "Team expense tracker with employee submit and manager approval.",
    rewrittenPrompt: `Expense app: Employee submits expenses with category/amount; Manager approves/rejects on a board. Screens: my expenses, submit form, approvals board, dashboard.`,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    roles: [
      {
        id: "employee",
        label: "Employee",
        description: "Submits own expenses",
        canCreate: true,
        isDefault: true,
      },
      {
        id: "manager",
        label: "Manager",
        description: "Approves team expenses",
        canManage: true,
        canCreate: true,
      },
    ],
    entities: [
      {
        id: "expense",
        name: "Expense",
        namePlural: "Expenses",
        statuses: ["Submitted", "Approved", "Rejected"],
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "amount", label: "Amount", type: "number", required: true },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: ["Travel", "Meals", "Software", "Office"],
          },
          { key: "status", label: "Status", type: "status" },
        ],
        seed: [
          { title: "Client lunch", amount: 1200, category: "Meals", status: "Submitted" },
          { title: "Uber airport", amount: 850, category: "Travel", status: "Approved" },
          { title: "Figma seat", amount: 1500, category: "Software", status: "Submitted" },
        ],
      },
    ],
    screens: [
      { id: "dash", title: "Dashboard", type: "dashboard", roleIds: [] },
      { id: "mine", title: "My expenses", type: "list", roleIds: ["employee"], entityId: "expense" },
      { id: "submit", title: "Submit expense", type: "form", roleIds: ["employee"], entityId: "expense" },
      { id: "approvals", title: "Approvals", type: "board", roleIds: ["manager"], entityId: "expense" },
      { id: "settings", title: "Settings", type: "settings", roleIds: ["manager"] },
    ],
    workflows: [
      {
        id: "wf-sub",
        name: "Submit expense",
        description: "Employee files a claim",
        roleId: "employee",
        steps: ["Open form", "Enter amount", "Submit", "Track status"],
        screenId: "submit",
        entityId: "expense",
      },
      {
        id: "wf-appr",
        name: "Approve expenses",
        description: "Manager decisions",
        roleId: "manager",
        steps: ["Open board", "Review", "Approve or reject"],
        screenId: "approvals",
        entityId: "expense",
      },
    ],
    research: research || undefined,
  };
}

function crmSpec(prompt: string, research?: StudioResearchPack | null): StudioAppSpec {
  return {
    version: 1,
    brandName: "Pipeline",
    tagline: "Leads · deals · follow-ups",
    description: research?.summary || "Lightweight CRM for leads and deal stages.",
    rewrittenPrompt: `CRM with Sales rep (log leads) and Manager (pipeline board). Entity Deal with stages New/Contacted/Proposal/Won.`,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    roles: [
      { id: "rep", label: "Sales rep", description: "Owns leads", canCreate: true, isDefault: true },
      { id: "manager", label: "Sales manager", description: "Full pipeline", canManage: true, canCreate: true },
    ],
    entities: [
      {
        id: "deal",
        name: "Deal",
        namePlural: "Deals",
        statuses: ["New", "Contacted", "Proposal", "Won"],
        fields: [
          { key: "title", label: "Company", type: "text", required: true },
          { key: "contact", label: "Contact", type: "text" },
          { key: "value", label: "Value", type: "number" },
          { key: "status", label: "Stage", type: "status" },
        ],
        seed: [
          { title: "Acme Co", contact: "Riya", value: 50000, status: "New" },
          { title: "Bright Labs", contact: "Sam", value: 120000, status: "Proposal" },
          { title: "Northwind", contact: "Lee", value: 30000, status: "Contacted" },
        ],
      },
    ],
    screens: [
      { id: "dash", title: "Dashboard", type: "dashboard", roleIds: [] },
      { id: "pipeline", title: "Pipeline", type: "board", roleIds: [], entityId: "deal" },
      { id: "new", title: "New lead", type: "form", roleIds: ["rep", "manager"], entityId: "deal" },
      { id: "list", title: "All deals", type: "list", roleIds: ["manager"], entityId: "deal" },
      { id: "settings", title: "Settings", type: "settings", roleIds: ["manager"] },
    ],
    workflows: [
      {
        id: "wf-lead",
        name: "Log a lead",
        description: "Rep adds a deal",
        roleId: "rep",
        steps: ["New lead", "Save", "See pipeline"],
        screenId: "new",
        entityId: "deal",
      },
      {
        id: "wf-pipe",
        name: "Advance pipeline",
        description: "Move deal stages",
        roleId: "manager",
        steps: ["Open pipeline", "Update stage"],
        screenId: "pipeline",
        entityId: "deal",
      },
    ],
    research: research || undefined,
  };
}
