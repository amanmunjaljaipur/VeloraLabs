"use client";

import { getGroupedAdminMenuLinks, isSuperAdminRole, type AdminNavGroup } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";
import {
  BarChart3,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contact,
  FileText,
  Landmark,
  LayoutDashboard,
  MessageSquareQuote,
  Megaphone,
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
import { useEffect, useRef, useState } from "react";

const HIDDEN_PREFIXES = ["/login", "/signup"];
const GROUPS_STORAGE_KEY = "verlin-admin-sidebar-open-groups";

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/analytics": BarChart3,
  "/admin/site-cms": LayoutGrid,
  "/admin/crm": Contact,
  "/admin/role-assignment": Users,
  "/admin/module-access": Shield,
  "/admin/legal": FileText,
  "/admin/testimonials": MessageSquareQuote,
  "/admin/sessions": Video,
  "/admin/chatbot-training": Bot,
  "/admin/agents": Shield,
  "/admin/blog": PenLine,
  "/admin/app-studio": Rocket,
  "/demo-apps": Rocket,
  "/admin/verlin-bank": Landmark,
  "/admin/newsletter": Newspaper,
  "/admin/marketing": Megaphone,
  "/newsletter/weekly": ScrollText,
  "/admin/bookings": ScrollText,
};

/** One representative icon per nav group - doubles as the tier-1 icon shown in the collapsed rail. */
const GROUP_ICONS: Record<AdminNavGroup, LucideIcon> = {
  Overview: LayoutDashboard,
  Content: FileText,
  "Bookings & People": Contact,
  Learning: Video,
  "AI Tools": Bot,
  Growth: Rocket,
  Platform: Shield,
};

function groupSlug(group: string): string {
  return group.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

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
  const groups = getGroupedAdminMenuLinks(role);
  const links = groups.flatMap((g) => g.links);
  const isSuperAdmin = isSuperAdminRole(role);
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const activeGroup = groups.find((g) => g.links.some((l) => isActivePath(pathname, l.href)))?.group;

  // Tier-1 -> tier-2 expand state for the full-width sidebar (accordion). Persisted per-browser
  // so a super admin's manually opened sections stick around between visits.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Tier-1 -> tier-2 flyout state for the icon-only collapsed rail (same group/child relationship,
  // shown as a floating panel instead of an inline accordion since there is no room for text).
  const [flyoutGroup, setFlyoutGroup] = useState<string | null>(null);
  const [flyoutCoords, setFlyoutCoords] = useState<{ top: number; left: number } | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let saved: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      // ignore storage errors
    }
    setOpenGroups(saved);
    setHydrated(true);
  }, []);

  // Whatever section the current page belongs to should never be hidden inside a collapsed group.
  useEffect(() => {
    if (!hydrated || !activeGroup) return;
    setOpenGroups((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeGroup, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      // ignore storage errors
    }
  }, [openGroups, hydrated]);

  // Close the flyout on navigation and whenever the sidebar itself switches width modes.
  useEffect(() => {
    setFlyoutGroup(null);
  }, [pathname, collapsed]);

  useEffect(() => {
    if (!flyoutGroup) {
      setFlyoutCoords(null);
      return;
    }
    const measure = () => {
      const rect = flyoutRef.current?.getBoundingClientRect();
      if (rect) setFlyoutCoords({ top: rect.top, left: rect.right + 8 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [flyoutGroup]);

  useEffect(() => {
    if (!flyoutGroup) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!flyoutRef.current?.contains(event.target as Node)) {
        setFlyoutGroup(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlyoutGroup(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flyoutGroup]);

  if (links.length === 0 || hidden) return null;

  function toggleGroup(group: string) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

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

          <div className="mt-2 flex-1 space-y-1">
            {groups.map((section) => {
              const GroupIcon = GROUP_ICONS[section.group] ?? Shield;
              const sectionActive = section.links.some((l) => isActivePath(pathname, l.href));
              const slug = groupSlug(section.group);

              if (collapsed) {
                const flyoutOpen = flyoutGroup === section.group;
                return (
                  <div
                    key={section.group}
                    ref={flyoutOpen ? flyoutRef : undefined}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFlyoutGroup((prev) => (prev === section.group ? null : section.group))
                      }
                      title={section.group}
                      aria-label={section.group}
                      aria-haspopup="menu"
                      aria-expanded={flyoutOpen}
                      className={cn(
                        "flex w-full items-center justify-center rounded-xl px-2 py-2.5 transition-colors",
                        sectionActive || flyoutOpen
                          ? "bg-accent-teal/10 text-accent-teal"
                          : "text-text-secondary hover:bg-muted"
                      )}
                    >
                      <GroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>

                    {flyoutOpen && flyoutCoords && (
                      <div
                        role="menu"
                        aria-label={section.group}
                        style={{ position: "fixed", top: flyoutCoords.top, left: flyoutCoords.left }}
                        className="z-50 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                      >
                        <p className="border-b border-border px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-text-muted">
                          {section.group}
                        </p>
                        <ul className="space-y-0.5 p-1.5">
                          {section.links.map((link) => {
                            const Icon = ICONS[link.href] ?? Shield;
                            const active = isActivePath(pathname, link.href);

                            return (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  role="menuitem"
                                  onClick={() => setFlyoutGroup(null)}
                                  className={cn(
                                    "flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                                    active
                                      ? "bg-accent-teal/10 text-accent-teal"
                                      : "text-foreground hover:bg-muted"
                                  )}
                                  aria-current={active ? "page" : undefined}
                                >
                                  <Icon
                                    className={cn(
                                      "mt-0.5 h-4 w-4 shrink-0",
                                      active ? "text-accent-teal" : "text-text-secondary"
                                    )}
                                    aria-hidden="true"
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium leading-snug">
                                      {link.label}
                                    </span>
                                    {link.description && (
                                      <span className="mt-0.5 block text-xs leading-snug text-text-secondary">
                                        {link.description}
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              }

              const isOpen = Boolean(openGroups[section.group]);
              const buttonId = `${slug}-button`;
              const panelId = `${slug}-panel`;

              return (
                <div key={section.group}>
                  <button
                    type="button"
                    id={buttonId}
                    onClick={() => toggleGroup(section.group)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <GroupIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        sectionActive ? "text-accent-teal" : "text-text-muted"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "flex-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
                        sectionActive ? "text-accent-teal" : "text-text-muted"
                      )}
                    >
                      {section.group}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-text-muted transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-in-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-1 pb-1 pt-1">
                        {section.links.map((link) => {
                          const Icon = ICONS[link.href] ?? Shield;
                          const active = isActivePath(pathname, link.href);

                          return (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className={cn(
                                  "flex items-start gap-2.5 rounded-xl px-2 py-2.5 transition-colors",
                                  active
                                    ? "bg-accent-teal/10 text-accent-teal"
                                    : "text-foreground hover:bg-muted"
                                )}
                                aria-current={active ? "page" : undefined}
                              >
                                <Icon
                                  className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0",
                                    active ? "text-accent-teal" : "text-text-secondary"
                                  )}
                                  aria-hidden="true"
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium leading-snug">
                                    {link.label}
                                  </span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs leading-snug text-text-secondary">
                                      {link.description}
                                    </span>
                                  )}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
