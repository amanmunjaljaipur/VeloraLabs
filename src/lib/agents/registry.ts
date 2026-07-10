/**
 * Canonical list of agents used across Verlin Labs + App Builder.
 * Super Admin can pause any agent; runtime agents are enforced in API routes.
 */

export type AgentKind = "runtime" | "design" | "ops";
export type AgentArea =
  | "Site"
  | "App Builder"
  | "Content"
  | "Marketing"
  | "Learning"
  | "Platform";

export type PlatformAgentId =
  | "site-chatbot"
  | "chatbot-retrain"
  | "app-builder-orchestrator"
  | "app-vertical-research"
  | "app-interview"
  | "app-builder-generate"
  | "forge-discovery"
  | "app-content"
  | "app-theme"
  | "app-admin-design"
  | "app-auth-design"
  | "app-tour-design"
  | "app-experience"
  | "app-hosting"
  | "verlin-product-builder"
  | "blog-ai"
  | "newsletter-ai"
  | "newsletter-mcp"
  | "document-summary"
  | "cron-blog"
  | "cron-newsletter";

export interface PlatformAgentDef {
  id: PlatformAgentId;
  name: string;
  area: AgentArea;
  kind: AgentKind;
  description: string;
  /** Where it shows up for operators */
  surfaces: string[];
  /** API / skill paths (informational) */
  routes: string[];
  /** If true, pause blocks public/API execution */
  pausableRuntime: boolean;
}

export const PLATFORM_AGENTS: PlatformAgentDef[] = [
  {
    id: "site-chatbot",
    name: "Site Chatbot",
    area: "Site",
    kind: "runtime",
    description: "Public assistant on verlinlabs.com answering visitor questions.",
    surfaces: ["Public site chat widget", "/api/chat"],
    routes: ["/api/chat"],
    pausableRuntime: true,
  },
  {
    id: "chatbot-retrain",
    name: "Chatbot Retrain",
    area: "Site",
    kind: "runtime",
    description: "Rebuilds chatbot knowledge from training Q&A.",
    surfaces: ["Admin → Chatbot Training"],
    routes: ["/api/admin/chatbot/retrain", "/api/admin/chatbot/test"],
    pausableRuntime: true,
  },
  {
    id: "app-builder-orchestrator",
    name: "App Builder Orchestrator",
    area: "App Builder",
    kind: "design",
    description: "Routes App Builder work and loads ops memory before building.",
    surfaces: ["Agent skills / Grok"],
    routes: [".grok/skills/app-builder-orchestrator"],
    pausableRuntime: false,
  },
  {
    id: "app-vertical-research",
    name: "Vertical Research Agent",
    area: "App Builder",
    kind: "runtime",
    description: "Researches app types (banking, insurance, shop…) into deploy-safe ops memory.",
    surfaces: ["App Builder research API", "Super Admin ops"],
    routes: ["/api/admin/app-builder/research"],
    pausableRuntime: true,
  },
  {
    id: "app-interview",
    name: "Interview / PM Agent",
    area: "App Builder",
    kind: "runtime",
    description: "Designs skippable guided questions from the user’s product idea.",
    surfaces: ["Admin → Forge → Discovery", "Interview API"],
    routes: ["/api/admin/app-builder/interview", "/api/forge/discovery"],
    pausableRuntime: true,
  },
  {
    id: "app-builder-generate",
    name: "App Generate Agent",
    area: "App Builder",
    kind: "runtime",
    description: "Generates live multi-tenant app content (shop or generic product sites).",
    surfaces: ["Admin → Forge → Build"],
    routes: ["/api/admin/app-builder/generate", "/api/forge/build"],
    pausableRuntime: true,
  },
  {
    id: "forge-discovery",
    name: "Forge Discovery",
    area: "App Builder",
    kind: "runtime",
    description:
      "Adaptive product interview + editable plan for Forge (discovery-first builder).",
    surfaces: ["Admin → Forge"],
    routes: ["/api/forge/discovery", "/api/forge/plan", "/api/forge/plan/edit"],
    pausableRuntime: false,
  },
  {
    id: "app-content",
    name: "App Content Agent",
    area: "App Builder",
    kind: "runtime",
    description: "SEO-ready shop/product wording improvements for tenant apps.",
    surfaces: ["Shop Dashboard → Improve wording"],
    routes: ["/api/apps/[slug]/admin/generate-content"],
    pausableRuntime: true,
  },
  {
    id: "app-theme",
    name: "Theme & Visuals Agent",
    area: "App Builder",
    kind: "runtime",
    description: "Multi-colour theme from logo/image and product photo helpers.",
    surfaces: ["Shop Brand & theme", "Product Find photos"],
    routes: [
      "/api/apps/[slug]/admin/theme-from-image",
      "/api/apps/[slug]/admin/product-images",
    ],
    pausableRuntime: true,
  },
  {
    id: "app-admin-design",
    name: "Admin UX Agent",
    area: "App Builder",
    kind: "design",
    description: "Design guidance for tenant admin menus, CMS, products UI.",
    surfaces: ["Agent skills"],
    routes: [".grok/skills/app-admin-agent"],
    pausableRuntime: false,
  },
  {
    id: "app-auth-design",
    name: "Auth & Tenancy Agent",
    area: "App Builder",
    kind: "design",
    description: "Per-app login, roles, cookies, owner bridge design rules.",
    surfaces: ["Agent skills"],
    routes: [".grok/skills/app-auth-agent"],
    pausableRuntime: false,
  },
  {
    id: "app-tour-design",
    name: "Tour & Onboarding Agent",
    area: "App Builder",
    kind: "design",
    description: "Guided overlay tour and launch checklist conventions.",
    surfaces: ["Agent skills", "Shop Take a tour"],
    routes: [".grok/skills/app-tour-agent"],
    pausableRuntime: false,
  },
  {
    id: "app-experience",
    name: "Experience Learner",
    area: "App Builder",
    kind: "ops",
    description: "Logs builder/owner learnings into deploy-safe ops memory.",
    surfaces: ["Ops memory API"],
    routes: ["/api/admin/app-builder/ops-memory"],
    pausableRuntime: true,
  },
  {
    id: "app-hosting",
    name: "Packaging & Hosting Agent",
    area: "App Builder",
    kind: "design",
    description: "Blob runtime data, static export, deploy-safety rules.",
    surfaces: ["Agent skills", "App export"],
    routes: [".grok/skills/app-hosting-agent"],
    pausableRuntime: false,
  },
  {
    id: "verlin-product-builder",
    name: "Verlin Product Builder",
    area: "Platform",
    kind: "design",
    description: "Core product judgment for App Builder extensions and menus.",
    surfaces: ["Agent skills"],
    routes: [".grok/skills/verlin-product-builder"],
    pausableRuntime: false,
  },
  {
    id: "blog-ai",
    name: "Blog AI Agent",
    area: "Content",
    kind: "runtime",
    description: "Generates and schedules blog posts.",
    surfaces: ["Admin → Blog Studio", "Cron blog"],
    routes: ["/api/admin/blog", "/api/cron/blog"],
    pausableRuntime: true,
  },
  {
    id: "newsletter-ai",
    name: "Newsletter AI Agent",
    area: "Marketing",
    kind: "runtime",
    description: "Generates weekly AI digest drafts from the web.",
    surfaces: ["Admin → Newsletter Studio"],
    routes: ["/api/admin/newsletter/generate", "/api/admin/newsletter/publish"],
    pausableRuntime: true,
  },
  {
    id: "newsletter-mcp",
    name: "Newsletter MCP Agent",
    area: "Marketing",
    kind: "runtime",
    description: "MCP tools for generate/publish/send newsletter editions.",
    surfaces: ["MCP newsletter server"],
    routes: ["/api/mcp/newsletter/*"],
    pausableRuntime: true,
  },
  {
    id: "document-summary",
    name: "Document Summary Agent",
    area: "Learning",
    kind: "runtime",
    description: "Summarises Google Drive / session training documents.",
    surfaces: ["Admin session documents preview"],
    routes: ["/api/session-documents/preview"],
    pausableRuntime: true,
  },
  {
    id: "cron-blog",
    name: "Cron: Blog publish",
    area: "Content",
    kind: "runtime",
    description: "Scheduled blog generation/publish job.",
    surfaces: ["Vercel Cron"],
    routes: ["/api/cron/blog"],
    pausableRuntime: true,
  },
  {
    id: "cron-newsletter",
    name: "Cron: Newsletter",
    area: "Marketing",
    kind: "runtime",
    description: "Scheduled newsletter generation/publish job.",
    surfaces: ["Vercel Cron"],
    routes: ["/api/cron/newsletter"],
    pausableRuntime: true,
  },
];

export function getAgentDef(id: string): PlatformAgentDef | undefined {
  return PLATFORM_AGENTS.find((a) => a.id === id);
}

export function listAgentIds(): PlatformAgentId[] {
  return PLATFORM_AGENTS.map((a) => a.id);
}
