"use client";

import { getAdminMenuLinks, isSuperAdminRole } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Contact,
  FileText,
  Landmark,
  LayoutDashboard,
  Rocket,
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
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/login", "/signup"];

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
  "/admin/agents": Shield,
  "/admin/blog": PenLine,
  "/admin/app-studio": Rocket,
  "/admin/verlin-bank": Landmark,
  "/admin/newsletter": Newspaper,
  "/newsletter/weekly": ScrollText,
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  if (href.startsWith("/admin/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminSidebarProps {
  role: UserRole;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ role, collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const links = getAdminMenuLinks(role);
  const isSuperAdmin = isSuperAdminRole(role);
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (links.length === 0 || hidden) return null;

  return (
    <>
      {/* Mobile: sticky horizontal nav */}
      <aside className="sticky top-16 z-40 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:top-[4.25rem] lg:hidden">
        <nav aria-label={isSuperAdmin ? "Super admin" : "Admin"}>
          <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {links.map((link) => {
              const Icon = ICONS[link.href] ?? Shield;
              const active = isActivePath(pathname, link.href);

              return (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Desktop: fixed left rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card pt-16 transition-[width] duration-300 ease-in-out lg:flex md:pt-[4.25rem]",
          collapsed ? "w-16" : "w-72"
        )}
      >
        <nav
          aria-label={isSuperAdmin ? "Super admin" : "Admin"}
          className="flex h-full flex-col overflow-y-auto px-2 py-4"
        >
          <div
            className={cn(
              "flex items-center border-b border-border pb-3",
              collapsed ? "justify-center px-1" : "gap-2 px-2"
            )}
          >
            <Shield className="h-4 w-4 shrink-0 text-accent-teal" aria-hidden="true" />
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            )}
          </div>

          <ul className="mt-2 flex-1 space-y-1">
            {links.map((link) => {
              const Icon = ICONS[link.href] ?? Shield;
              const active = isActivePath(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    className={cn(
                      "flex rounded-xl transition-colors",
                      collapsed
                        ? "items-center justify-center px-2 py-2.5"
                        : "items-start gap-2.5 px-2 py-2.5",
                      active
                        ? "bg-accent-teal/10 text-accent-teal"
                        : "text-foreground hover:bg-muted"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        collapsed ? "" : "mt-0.5",
                        active ? "text-accent-teal" : "text-text-secondary"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && (
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-snug">{link.label}</span>
                        {link.description && (
                          <span className="mt-0.5 block text-xs leading-snug text-text-secondary">
                            {link.description}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {onToggle && (
            <div className={cn("mt-auto border-t border-border pt-3", collapsed ? "px-1" : "px-2")}>
              <button
                type="button"
                onClick={onToggle}
                className={cn(
                  "flex w-full items-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted",
                  collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2"
                )}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}