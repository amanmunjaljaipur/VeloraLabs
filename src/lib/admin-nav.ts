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
    label: "Role Assignment",
    href: "/admin/role-assignment",
    description: "Assign roles by email",
  },
  {
    label: "Session Videos",
    href: "/admin/sessions",
    description: "Manage course recordings",
  },
  {
    label: "Chatbot Training",
    href: "/admin/chatbot-training",
    description: "Label Q&A, import Excel, retrain assistant",
    superAdminOnly: true,
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

