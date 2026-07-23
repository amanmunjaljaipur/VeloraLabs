import { isSuperAdminRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export { isSuperAdminRole };

export interface AdminNavLink {
  label: string;
  href: string;
  description?: string;
  superAdminOnly?: boolean;
}

export const ADMIN_MENU_LINKS: AdminNavLink[] = [
  {
    label: "Overview",
    href: "/admin",
    description: "Admin home and quick links",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    description: "Bookings, leads, learners, and trends",
  },
  {
    label: "Free Session Bookings",
    href: "/admin/bookings",
    description: "Live slot occupancy and booking list for the 5 daily slots",
  },
  {
    label: "Session Slots",
    href: "/admin/bookings/slots",
    description: "Manage bookable time slots by category - Free, Students, Engineers, Professionals",
    superAdminOnly: true,
  },
  {
    label: "Site CMS",
    href: "/admin/site-cms",
    description: "Edit pages, copy, images, and content",
  },
  {
    label: "CRM",
    href: "/admin/crm",
    description: "Bookings, contacts, subscribers, people",
  },
  {
    label: "Role Assignment",
    href: "/admin/role-assignment",
    description: "Assign roles by email",
  },
  {
    label: "Course Access",
    href: "/admin/module-access",
    description: "Grant full program or selected module access by email",
  },
  {
    label: "Legal Policies",
    href: "/admin/legal",
    description: "Terms, privacy, and refund policy CMS",
  },
  {
    label: "Session Videos",
    href: "/admin/sessions",
    description: "Manage recordings and learner comments",
  },
  {
    label: "Chatbot Training",
    href: "/admin/chatbot-training",
    description: "Label Q&A, import Excel, retrain assistant",
    superAdminOnly: true,
  },
  {
    label: "Agents",
    href: "/admin/agents",
    description: "Table of all AI/product agents - pause or resume anytime",
    superAdminOnly: true,
  },
  {
    label: "Blog Studio",
    href: "/admin/blog",
    description: "AI blog posts, daily sequence, schedule publish",
  },
  {
    label: "App Studio",
    href: "/admin/app-studio",
    description: "AI app generator - chat, live preview, code, version history",
  },
  {
    label: "50 Demo Apps",
    href: "/demo-apps",
    description: "Interactive multi-role demos for 50 product categories",
  },
  {
    label: "Verlin Bank",
    href: "/admin/verlin-bank",
    description: "Verlin Bank prototype (Project Aura) - RBAC & multi-agent banking dashboard",
  },
  {
    label: "Newsletter Studio",
    href: "/admin/newsletter",
    description: "Create, preview, and send AI digest",
    superAdminOnly: true,
  },
  {
    label: "Weekly Newsletter",
    href: "/newsletter/weekly",
    description: "View published editions",
    superAdminOnly: true,
  },
];

export function getAdminMenuLinks(role: UserRole | undefined): AdminNavLink[] {
  if (!role || (role !== "admin" && role !== "super_admin")) return [];
  return ADMIN_MENU_LINKS.filter((link) => !link.superAdminOnly || role === "super_admin");
}
