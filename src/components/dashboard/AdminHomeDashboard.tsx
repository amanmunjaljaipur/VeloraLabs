import { Card } from "@/components/ui/Card";
import { getAdminMenuLinks } from "@/lib/admin-nav";
import { ROLE_LABELS } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import {
  BarChart3,
  Bot,
  Contact,
  FileText,
  Flame,
  LayoutDashboard,
  LayoutGrid,
  Newspaper,
  PenLine,
  ScrollText,
  Shield,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface AdminHomeDashboardProps {
  userName: string | null | undefined;
  role: UserRole;
}

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/analytics": BarChart3,
  "/admin/site-cms": LayoutGrid,
  "/admin/crm": Contact,
  "/admin/role-assignment": Users,
  "/admin/module-access": Shield,
  "/admin/legal": FileText,
  "/admin/sessions": Video,
  "/admin/chatbot-training": Bot,
  "/admin/blog": PenLine,
  "/admin/forge": Flame,
  "/admin/newsletter": Newspaper,
  "/newsletter/weekly": ScrollText,
};

export function AdminHomeDashboard({ userName, role }: AdminHomeDashboardProps) {
  const firstName = userName?.split(" ")[0] ?? "Admin";
  const links = getAdminMenuLinks(role).filter((link) => link.href !== "/admin");

  return (
    <section className="pb-16">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-teal">
          {ROLE_LABELS[role]} dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Manage site content, learner roles, bookings, analytics, and program operations from one
          place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => {
          const Icon = ICONS[link.href] ?? Shield;
          return (
            <Link key={link.href} href={link.href}>
              <Card hover className="h-full p-5">
                <Icon className="h-6 w-6 text-accent-teal" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">{link.label}</h2>
                {link.description && (
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {link.description}
                  </p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}