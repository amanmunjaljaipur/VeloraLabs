import { isSuperAdminRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export { isSuperAdminRole };

export type AdminNavGroup =
  | "Overview"
  | "Content"
  | "Bookings & People"
  | "Learning"
  | "AI Tools"
  | "Growth"
  | "Platform";

export interface AdminNavLink {
  label: string;
  href: string;
  description?: string;
  superAdminOnly?: boolean;
  group: AdminNavGroup;
}

/**
 * Grouped so the sidebar reads as a handful of sections instead of one long
 * flat list of icons. A few closely related pages that used to have their
 * own top-level entry (Session Slots, 50 Demo Apps, Weekly Newsletter) are
 * still fully functional at their same URLs - they are just reached via a
 * link inside their parent page now (Bookings, App Studio, Newsletter
 * Studio respectively) instead of a separate sidebar icon.
 */
export const ADMIN_MENU_LINKS: AdminNavLink[] = [
  {
    label: "Overview",
    href: "/admin",
    description: "Admin home and quick links",
    group: "Overview",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    description: "Bookings, leads, learners, and trends",
    group: "Overview",
  },
  {
    label: "Blog Studio",
    href: "/admin/blog",
    description: "AI blog posts, daily sequence, schedule and preview before publish",
    group: "Content",
  },
  {
    label: "Site CMS",
    href: "/admin/site-cms",
    description: "Edit pages, copy, images, and content",
    group: "Content",
  },
  {
    label: "Legal Policies",
    href: "/admin/legal",
    description: "Terms, privacy, and refund policy CMS",
    group: "Content",
  },
  {
    label: "Free Session Bookings",
    href: "/admin/bookings",
    description: "Slot occupancy, booking list, and session slot management",
    group: "Bookings & People",
  },
  {
    label: "CRM",
    href: "/admin/crm",
    description: "Bookings, contacts, subscribers, people",
    group: "Bookings & People",
  },
  {
    label: "Role Assignment",
    href: "/admin/role-assignment",
    description: "Assign roles by email",
    group: "Bookings & People",
  },
  {
    label: "Course Access",
    href: "/admin/module-access",
    description: "Grant full program or selected module access by email",
    group: "Bookings & People",
  },
  {
    label: "Session Videos",
    href: "/admin/sessions",
    description: "Manage recordings and learner comments",
    group: "Learning",
  },
  {
    label: "Chatbot Training",
    href: "/admin/chatbot-training",
    description: "Label Q&A, import Excel, retrain assistant",
    superAdminOnly: true,
    group: "AI Tools",
  },
  {
    label: "App Studio",
    href: "/admin/app-studio",
    description: "AI app generator, plus the 50 interactive demo apps",
    group: "AI Tools",
  },
  {
    label: "Verlin Bank",
    href: "/admin/verlin-bank",
    description: "Verlin Bank prototype (Project Aura) - RBAC & multi-agent banking dashboard",
    group: "AI Tools",
  },
  {
    label: "Newsletter Studio",
    href: "/admin/newsletter",
    description: "Create, preview, and send the AI digest - and browse past editions",
    superAdminOnly: true,
    group: "Growth",
  },
  {
    label: "Agents",
    href: "/admin/agents",
    description: "Table of all AI/product agents - pause or resume anytime",
    superAdminOnly: true,
    group: "Platform",
  },
];

export function getAdminMenuLinks(role: UserRole | undefined): AdminNavLink[] {
  if (!role || (role !== "admin" && role !== "super_admin")) return [];
  return ADMIN_MENU_LINKS.filter((link) => !link.superAdminOnly || role === "super_admin");
}

export function getGroupedAdminMenuLinks(
  role: UserRole | undefined
): { group: AdminNavGroup; links: AdminNavLink[] }[] {
  const links = getAdminMenuLinks(role);
  const order: AdminNavGroup[] = [
    "Overview",
    "Content",
    "Bookings & People",
    "Learning",
    "AI Tools",
    "Growth",
    "Platform",
  ];
  return order
    .map((group) => ({ group, links: links.filter((l) => l.group === group) }))
    .filter((section) => section.links.length > 0);
}
