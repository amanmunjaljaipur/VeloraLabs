/**
 * Industry-standard roles missing from thin category blueprints.
 * Merged by slug (preferred) or group defaults - production multi-sided markets need ≥4 roles.
 */

import type { DemoCategoryDef } from "./types";

type Role = DemoCategoryDef["roles"][0];

function r(
  id: string,
  label: string,
  description: string,
  opts: Partial<Role> = {}
): Role {
  return {
    id,
    label,
    description,
    canCreate: opts.canCreate ?? true,
    canManage: opts.canManage ?? false,
    isDefault: opts.isDefault ?? false,
  };
}

/** Extra roles to merge when not already present (by id). */
const SLUG_EXTRA_ROLES: Record<string, Role[]> = {
  // Social
  "instant-messaging": [
    r("business", "Business account", "Run a verified business inbox, catalogs, and quick replies.", {
      canManage: true,
    }),
    r("admin", "Platform admin", "Policy, bans, and platform-wide safety settings.", {
      canManage: true,
      canCreate: false,
    }),
  ],
  "social-networking": [
    r("advertiser", "Advertiser", "Create campaigns and review ad performance (demo).", {
      canCreate: true,
    }),
    r("admin", "Platform admin", "Trust & safety policy and appeals.", { canManage: true }),
  ],
  "professional-networking": [
    r("mentor", "Mentor", "Accept intro requests and offer career guidance.", {
      canManage: true,
    }),
    r("company_admin", "Company page admin", "Manage company page posts and applicants.", {
      canManage: true,
      canCreate: true,
    }),
  ],
  "short-form-video": [
    r("brand", "Brand partner", "Sponsor challenges and review branded content.", {
      canCreate: true,
    }),
    r("ops", "Trust & safety ops", "Escalate high-risk reports.", { canManage: true }),
  ],
  "dating-matchmaking": [
    r("support", "Member support", "Handle account recovery and report outcomes.", {
      canManage: true,
    }),
    r("admin", "Trust admin", "Ban, pause, and policy controls.", { canManage: true }),
  ],
  "community-forums": [
    r("expert", "Subject expert", "Answer questions and mark best replies.", {
      canCreate: true,
      canManage: true,
    }),
    r("support", "Community support", "Help with account and access issues.", {
      canManage: true,
    }),
  ],

  // Entertainment
  "svod-streaming": [
    r("ops", "Content ops", "Publish, unpublish, and schedule catalog titles.", {
      canManage: true,
      canCreate: true,
    }),
    r("admin", "Platform admin", "Plans, regions, and content policy.", { canManage: true }),
  ],
  "ugc-video": [
    r("ops", "Trust & safety", "Copyright and community report queue.", { canManage: true }),
    r("admin", "Platform admin", "Monetization policy and channel strikes.", {
      canManage: true,
    }),
  ],
  "music-podcasts": [
    r("publisher", "Label / publisher", "Release catalogs and manage rights metadata.", {
      canCreate: true,
      canManage: true,
    }),
    r("admin", "Catalog admin", "Archive rights-limited titles.", { canManage: true }),
  ],
  audiobooks: [
    r("narrator", "Narrator studio", "Upload narration metadata and chapter status.", {
      canCreate: true,
    }),
    r("admin", "Library admin", "Rights and catalog quality.", { canManage: true }),
  ],
  "creative-editors": [
    r("reviewer", "Brand reviewer", "Approve exports against brand rules.", {
      canManage: true,
    }),
    r("admin", "Template admin", "Curate shared templates.", { canManage: true, canCreate: true }),
  ],
  "digital-reading": [
    r("publisher", "Publisher", "Publish issues and manage issues calendar.", {
      canCreate: true,
      canManage: true,
    }),
    r("admin", "Library admin", "Archive and collection policy.", { canManage: true }),
  ],

  // Fintech
  "digital-banking": [
    r("rm", "Relationship manager", "Serve priority customers and escalate cases.", {
      canManage: true,
    }),
    r("compliance", "Compliance officer", "Review alerts, holds, and audit notes.", {
      canManage: true,
      canCreate: false,
    }),
    r("admin", "Bank admin", "Limits, product flags, and staff access (demo).", {
      canManage: true,
    }),
  ],
  "mobile-wallets": [
    r("ops", "Payments ops", "Failed payments, refunds, and settlement exceptions.", {
      canManage: true,
    }),
    r("support", "Customer support", "Wallet freezes and dispute intake.", { canManage: true }),
    r("admin", "Program admin", "Limits, KYC flags, and merchant onboarding.", {
      canManage: true,
    }),
  ],
  "retail-banking": [
    r("ops", "Branch ops", "Clear queues and service requests.", { canManage: true }),
    r("compliance", "Compliance", "KYC and case reviews.", { canManage: true }),
    r("admin", "Bank admin", "Branch configuration and staff roles.", { canManage: true }),
  ],
  insurtech: [
    r("ops", "Claims ops", "Triage intake and assign adjusters.", { canManage: true }),
    r("underwriter", "Underwriter", "Review risk and approve coverages (demo).", {
      canManage: true,
    }),
    r("admin", "Product admin", "Plan catalog and rules.", { canManage: true, canCreate: true }),
  ],
  "retail-investing": [
    r("ops", "Brokerage ops", "Failed orders and settlement statuses.", { canManage: true }),
    r("admin", "Platform admin", "Instrument catalog and risk flags.", { canManage: true }),
  ],
  "crypto-exchange": [
    r("ops", "Exchange ops", "Deposits, withdrawals, and book statuses.", { canManage: true }),
    r("support", "User support", "Account recovery and ticket triage.", { canManage: true }),
    r("admin", "Exchange admin", "Listing and market controls (demo).", { canManage: true }),
  ],

  // Ecommerce
  "mass-marketplace": [
    r("support", "Customer support", "Returns, refunds, and order disputes.", {
      canManage: true,
    }),
    r("admin", "Marketplace admin", "Category and seller policy.", { canManage: true }),
  ],
  "food-delivery": [
    r("ops", "City ops", "Dispatch issues, refunds, and restaurant quality.", {
      canManage: true,
    }),
    r("support", "Support", "Order complaints and refunds.", { canManage: true }),
  ],
  "grocery-qcommerce": [
    r("rider", "Delivery partner", "Last-mile handoff and delivery status.", {
      canManage: true,
    }),
    r("ops", "Dark-store ops", "Stockouts and SLA monitoring.", { canManage: true }),
    r("admin", "Catalog admin", "Assortment and pricing rules (demo).", {
      canManage: true,
      canCreate: true,
    }),
  ],
  "secondhand-marketplace": [
    r("moderator", "Trust & safety", "Remove scams and prohibited listings.", {
      canManage: true,
    }),
    r("admin", "Marketplace admin", "Category policy and fees (demo).", { canManage: true }),
  ],
  "brand-shopping": [
    r("merchandiser", "Merchandiser", "Publish products and collections.", {
      canCreate: true,
      canManage: true,
    }),
    r("support", "CX support", "Orders, returns, and size help.", { canManage: true }),
    r("admin", "Store admin", "Theme, shipping zones, and staff (demo).", {
      canManage: true,
    }),
  ],
  "loyalty-cashback": [
    r("merchant", "Partner merchant", "Fund offers and view redemptions.", {
      canCreate: true,
      canManage: true,
    }),
    r("admin", "Program admin", "Earn rules and expiry policy.", { canManage: true }),
    r("support", "Member support", "Missing points and redemption issues.", {
      canManage: true,
    }),
  ],

  // Utilities
  "web-browsers": [
    r("it", "IT admin", "Managed browser policies for organizations.", {
      canManage: true,
    }),
    r("support", "Support", "Sync and profile recovery help.", { canManage: true }),
  ],
  "cloud-storage": [
    r("admin", "Workspace admin", "Sharing defaults, retention, offboarding.", {
      canManage: true,
    }),
    r("support", "IT support", "Restore and access tickets.", { canManage: true }),
  ],
  "password-managers": [
    r("admin", "Org admin", "Emergency access and SSO policy language.", {
      canManage: true,
    }),
    r("support", "Support", "Recovery assistance without reading secrets.", {
      canManage: true,
      canCreate: false,
    }),
  ],
  "mfa-authenticators": [
    r("admin", "Security admin", "Org enrollment coverage and revokes.", {
      canManage: true,
    }),
    r("support", "IT support", "Lockout recovery playbooks.", { canManage: true }),
  ],
  "weather-forecasting": [
    r("editor", "Forecast editor", "Publish alerts with calm, actionable copy.", {
      canCreate: true,
      canManage: true,
    }),
    r("admin", "Editorial admin", "Alert severity policy.", { canManage: true }),
  ],
  "vpn-privacy": [
    r("ops", "Network ops", "Abuse cases and capacity language.", { canManage: true }),
    r("admin", "Service admin", "Locations and plan flags (demo).", { canManage: true }),
  ],

  // Productivity
  "team-communication": [
    r("guest", "Guest", "Limited channel access for external partners.", {
      canCreate: false,
      canManage: false,
    }),
    r("owner", "Workspace owner", "Billing and deletion controls (demo).", {
      canManage: true,
    }),
  ],
  "video-conferencing": [
    r("scheduler", "Scheduler", "Book rooms and send agendas for others.", {
      canCreate: true,
    }),
    r("admin", "IT admin", "Recording retention and domain policies.", {
      canManage: true,
    }),
  ],
  "email-clients": [
    r("admin", "Mail admin", "Shared mailboxes and routing rules.", {
      canManage: true,
    }),
    r("support", "Helpdesk", "Shared support inbox workflows.", {
      canManage: true,
      canCreate: true,
    }),
  ],
  "task-project-management": [
    r("viewer", "Stakeholder viewer", "Read-only portfolio visibility.", {
      canCreate: false,
      canManage: false,
    }),
    r("contractor", "Contractor", "Work assigned tasks without admin rights.", {
      canCreate: true,
    }),
  ],
  "wikis-notes": [
    r("viewer", "Reader", "Browse published pages only.", {
      canCreate: false,
      canManage: false,
    }),
    r("admin", "Space admin", "Permissions and archive policy.", { canManage: true }),
  ],
  "generative-ai-assistants": [
    r("reviewer", "Human reviewer", "Approve or reject model drafts before use.", {
      canManage: true,
    }),
    r("admin", "AI policy admin", "Allowed use cases and retention.", { canManage: true }),
  ],

  // Education
  "language-learning": [
    r("parent", "Parent / guardian", "View progress without changing curriculum.", {
      canCreate: false,
      canManage: false,
    }),
    r("content", "Content designer", "Author units and tips for skills.", {
      canCreate: true,
      canManage: true,
    }),
  ],
  "online-learning-moocs": [
    r("ta", "Teaching assistant", "Moderate forums and grade light work.", {
      canManage: true,
    }),
    r("employer", "Employer sponsor", "Assign courses to a cohort (demo).", {
      canCreate: false,
      canManage: true,
    }),
  ],
  "lms-classroom": [
    r("parent", "Parent", "View grades and missing work (demo).", {
      canCreate: false,
    }),
    r("counselor", "Counselor", "Support plans and attendance notes.", {
      canManage: true,
    }),
  ],
  flashcards: [
    r("admin", "Library admin", "Featured decks and quality control.", {
      canManage: true,
    }),
    r("publisher", "Publisher", "Sell or share premium decks (demo).", {
      canCreate: true,
      canManage: true,
    }),
  ],
  "brain-training": [
    r("researcher", "Research ops", "Anonymized progress exports (demo).", {
      canManage: true,
      canCreate: false,
    }),
    r("parent", "Parent", "Youth program progress view.", { canCreate: false }),
  ],

  // Health
  "fitness-trackers": [
    r("physio", "Physiotherapist", "Assign recovery plans with care notes.", {
      canManage: true,
      canCreate: true,
    }),
    r("admin", "Program admin", "Workout catalog.", { canManage: true, canCreate: true }),
  ],
  "meditation-mindfulness": [
    r("therapist", "Care professional", "Assign programs with clinical caution language.", {
      canManage: true,
    }),
    r("admin", "Content admin", "Session catalog.", { canManage: true, canCreate: true }),
  ],
  "calorie-nutrition": [
    r("dietitian", "Dietitian", "Review logs and coach with respect.", {
      canManage: true,
    }),
    r("admin", "Food DB admin", "Food database quality.", { canManage: true }),
  ],
  "menstrual-tracking": [
    r("admin", "Privacy admin", "Retention and sharing policy language.", {
      canManage: true,
      canCreate: false,
    }),
    r("support", "App support", "Account and export help - no health advice.", {
      canManage: true,
    }),
  ],
  telemedicine: [
    r("nurse", "Care coordinator", "Triage intake and follow-ups.", {
      canManage: true,
      canCreate: true,
    }),
    r("pharmacist", "Pharmacist", "Prescription fulfillment language (demo).", {
      canManage: true,
    }),
    r("admin", "Clinic admin", "Schedules and provider rosters.", { canManage: true }),
  ],

  // Travel
  "ride-sharing": [
    r("safety", "Safety specialist", "Incident reports and emergency tooling language.", {
      canManage: true,
    }),
    r("admin", "City admin", "Zones and surge policy (demo).", { canManage: true }),
  ],
  "navigation-maps": [
    r("editor", "Map editor", "Fix POIs and road attributes.", {
      canCreate: true,
      canManage: true,
    }),
    r("admin", "Data admin", "Region quality and publish gates.", { canManage: true }),
  ],
  "travel-booking": [
    r("agent", "Travel agent", "Changes, special requests, and rebooking.", {
      canManage: true,
      canCreate: true,
    }),
    r("ops", "Inventory ops", "Allotments and failed bookings.", { canManage: true }),
    r("admin", "Platform admin", "Property onboarding.", { canManage: true }),
  ],
  "local-discovery": [
    r("reviewer", "Local guide", "Write trusted reviews and lists.", { canCreate: true }),
    r("admin", "Directory admin", "Category and spam policy.", { canManage: true }),
  ],
};

/** Group fallback if slug map is thin (ensures ≥1 extra staff role). */
const GROUP_EXTRA: Partial<Record<DemoCategoryDef["group"], Role[]>> = {
  fintech: [
    r("support", "Customer support", "Cases, freezes, and dispute intake.", {
      canManage: true,
    }),
    r("compliance", "Compliance", "Reviews holds and audit notes.", { canManage: true }),
  ],
  ecommerce: [
    r("support", "Support", "Orders, returns, and refunds.", { canManage: true }),
    r("admin", "Platform admin", "Policy and catalog controls.", { canManage: true }),
  ],
  health: [
    r("admin", "Service admin", "Catalog and privacy policy controls.", {
      canManage: true,
    }),
  ],
  education: [
    r("admin", "Platform admin", "Catalog and school settings.", { canManage: true }),
  ],
};

/**
 * Merge industry-standard roles into a category without duplicating ids.
 * Guarantees a sensible multi-sided cast for demos.
 */
export function ensureIndustryRoles(def: DemoCategoryDef): DemoCategoryDef {
  const existing = new Set(def.roles.map((x) => x.id.toLowerCase()));
  const extras = [
    ...(SLUG_EXTRA_ROLES[def.slug] || []),
    ...(GROUP_EXTRA[def.group] || []),
  ];

  const added: Role[] = [];
  for (const role of extras) {
    if (existing.has(role.id.toLowerCase())) continue;
    // Also skip if a similar label already exists (fuzzy)
    if (def.roles.some((x) => x.label.toLowerCase() === role.label.toLowerCase())) continue;
    existing.add(role.id.toLowerCase());
    added.push({ ...role, isDefault: false });
  }

  if (!added.length) return def;

  const roles = [...def.roles.map((x) => ({ ...x })), ...added];
  // Exactly one default
  let saw = false;
  for (const role of roles) {
    if (role.isDefault) {
      if (saw) role.isDefault = false;
      else saw = true;
    }
  }
  if (!saw && roles[0]) roles[0].isDefault = true;

  // Workflows for new roles pointing at a visible module
  const home =
    def.modules.find((m) => m.id === "home" || m.type === "dashboard") || def.modules[0];
  const manageMod =
    def.modules.find((m) => m.roleIds?.some((id) => added.some((a) => a.id === id))) ||
    def.modules.find((m) => m.type === "board" || m.type === "list") ||
    home;

  const workflows = [...def.workflows];
  for (const role of added) {
    if (workflows.some((w) => w.roleId === role.id)) continue;
    workflows.push({
      id: `wf-role-${role.id}`,
      name: `${role.label} path`,
      description: role.description,
      roleId: role.id,
      steps: ["Open home", "Use role modules", "Complete one status change"],
      moduleId: manageMod?.id || "home",
      entityId: manageMod?.entityId,
    });
  }

  // Ensure new staff roles can see at least one manage module: open settings + admin-like
  const modules = def.modules.map((m) => {
    if (!m.roleIds?.length) return m;
    // If module is staff-oriented, append new manage roles
    const isStaff =
      m.roleIds.some((id) =>
        /admin|ops|support|moderator|teacher|coach|compliance|agent/i.test(id)
      ) || /admin|ops|support|safety|grade|coach|clinician/i.test(m.id);
    if (!isStaff) return m;
    const nextIds = [...m.roleIds];
    for (const role of added) {
      if (role.canManage && !nextIds.includes(role.id)) nextIds.push(role.id);
    }
    return { ...m, roleIds: nextIds };
  });

  return { ...def, roles, workflows, modules };
}
