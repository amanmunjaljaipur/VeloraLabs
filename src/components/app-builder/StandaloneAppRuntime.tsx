"use client";

import { AppAdminPanel } from "@/components/app-builder/AppAdminPanel";
import { AppAuthScreens } from "@/components/app-builder/AppAuthScreens";
import { AppBuilderFooter } from "@/components/app-builder/AppBuilderFooter";
import {
  AppGuidedTour,
  AppTourReplayButton,
} from "@/components/app-builder/AppGuidedTour";
import { EcomLocalShopApp } from "@/components/app-builder/EcomLocalShopApp";
import { resolveShopTheme, withAlpha } from "@/lib/app-builder/shop-theme";
import type { EcomLocalShopContent } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRoute =
  | "home"
  | "shop"
  | "about"
  | "faq"
  | "contact"
  | "login"
  | "signup"
  | "account"
  | "admin"
  | "admin-cms"
  | "admin-cms-home"
  | "admin-cms-about"
  | "admin-cms-contact"
  | "admin-cms-faq"
  | "admin-crm"
  | "admin-products"
  | "admin-orders"
  | "admin-customers"
  | "admin-roles"
  | "admin-settings";

function parseRoute(segments: string[]): AppRoute {
  const a = segments[0] || "home";
  if (a === "login") return "login";
  if (a === "signup") return "signup";
  if (a === "account") return "account";
  if (a === "admin") {
    const b = segments[1];
    if (b === "cms") return "admin-cms";
    if (b === "crm") return "admin-crm";
    if (b === "products") return "admin-products";
    if (b === "orders") return "admin-orders";
    if (b === "customers" || b === "team") return "admin-customers";
    if (b === "roles") return "admin-roles";
    if (b === "settings") return "admin-settings";
    return "admin";
  }
  if (a === "shop" || a === "about" || a === "faq" || a === "contact") return a;
  return "home";
}

function routeToPath(basePath: string, route: AppRoute): string {
  const map: Record<AppRoute, string> = {
    home: basePath,
    shop: `${basePath}/shop`,
    about: `${basePath}/about`,
    faq: `${basePath}/faq`,
    contact: `${basePath}/contact`,
    login: `${basePath}/login`,
    signup: `${basePath}/signup`,
    account: `${basePath}/account`,
    admin: `${basePath}/admin`,
    "admin-cms": `${basePath}/admin/cms`,
    "admin-cms-home": `${basePath}/admin/cms`,
    "admin-cms-about": `${basePath}/admin/cms`,
    "admin-cms-contact": `${basePath}/admin/cms`,
    "admin-cms-faq": `${basePath}/admin/cms`,
    "admin-crm": `${basePath}/admin/crm`,
    "admin-products": `${basePath}/admin/products`,
    "admin-orders": `${basePath}/admin/orders`,
    "admin-customers": `${basePath}/admin/team`,
    "admin-roles": `${basePath}/admin/roles`,
    "admin-settings": `${basePath}/admin/settings`,
  };
  return map[route];
}

export interface AppUserView {
  email: string;
  name: string;
  roleId: string;
  roleLabel: string;
  isStaff: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  viaPlatformSuperAdmin?: boolean;
}

export function StandaloneAppRuntime({
  content: initialContent,
  basePath,
  slug,
  pathSegments = [],
}: {
  content: EcomLocalShopContent;
  basePath: string;
  slug: string;
  pathSegments?: string[];
}) {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(pathSegments));
  const [content, setContent] = useState(initialContent);
  const [user, setUser] = useState<AppUserView | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [forceTour, setForceTour] = useState(false);

  const theme = resolveShopTheme(content);
  const accent = theme.primary;

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${slug}/auth/me`);
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AppUserView | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/apps/${slug}/auth/me`);
        if (cancelled) return;
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user: AppUserView | null };
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const go = useCallback(
    (next: AppRoute) => {
      setRoute(next);
      const url = routeToPath(basePath, next);
      if (typeof window !== "undefined") {
        window.history.pushState({ appRoute: next }, "", url);
      }
    },
    [basePath]
  );

  useEffect(() => {
    const onPop = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname.replace(/\/$/, "");
      const base = basePath.replace(/\/$/, "");
      const rest = path.startsWith(base) ? path.slice(base.length).replace(/^\//, "") : "";
      const segs = rest.split("/").filter(Boolean);
      setRoute(parseRoute(segs));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [basePath]);

  async function handleLogout() {
    await fetch(`/api/apps/${slug}/auth/logout`, { method: "POST" });
    setUser(null);
    go("home");
  }

  const shopPathSeg = useMemo(() => {
    if (route === "shop") return ["shop"];
    if (route === "about") return ["about"];
    if (route === "faq") return ["faq"];
    if (route === "contact") return ["contact"];
    return [];
  }, [route]);

  const isAdminRoute = route.startsWith("admin");
  const isAuthRoute = route === "login" || route === "signup";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground" data-app-standalone="true">
      {/* Always-visible top bar — works in shop AND admin so you can leave admin */}
      <header
        className="sticky top-0 z-[60] border-b border-border bg-card shadow-sm"
        data-tour="header"
      >
        <div className="mx-auto flex w-full max-w-[100vw] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-2 text-left"
            data-tour="brand"
          >
            {content.logo?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.logo.imageUrl}
                alt=""
                className="h-9 w-9 rounded-xl object-cover shadow"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow"
                style={{
                  background: `linear-gradient(145deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                }}
              >
                {content.logo?.initials || content.brandName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block text-sm font-semibold" style={{ color: theme.primary }}>
                {content.brandName}
              </span>
              <span className="block text-[10px] text-text-muted">
                {isAdminRoute ? "Admin · " : ""}
                {content.city}
              </span>
            </span>
          </button>

          {/* Public pages always reachable from top menu */}
          <nav
            className="flex flex-wrap items-center gap-1 text-sm font-medium"
            aria-label="Shop pages"
            data-tour="nav"
          >
            {(
              [
                ["home", "Home", Home],
                ["shop", "Products", ShoppingBag],
                ["about", "About", Store],
                ["contact", "Contact", ExternalLink],
              ] as const
            ).map(([r, label, Icon]) => (
              <button
                key={r}
                type="button"
                onClick={() => go(r)}
                data-tour={`nav-${r}`}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5"
                style={
                  route === r && !isAdminRoute
                    ? { background: withAlpha(theme.primary, 0.12), color: theme.primary }
                    : undefined
                }
              >
                <Icon className="hidden h-3.5 w-3.5 sm:inline" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-sm" data-tour="auth-actions">
            {/* Always available — shop and admin can replay overlay tour */}
            <AppTourReplayButton accent={accent} onClick={() => setForceTour(true)} />
            {isAdminRoute ? (
              <button
                type="button"
                onClick={() => go("home")}
                data-tour="back-to-shop"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: theme.onPrimary,
                }}
              >
                <Store className="h-3.5 w-3.5" />
                Back to shop
              </button>
            ) : null}
            {user?.isAdmin || user?.isStaff ? (
              <button
                type="button"
                onClick={() => go("admin")}
                data-tour="dashboard"
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-muted",
                  isAdminRoute && "bg-muted"
                )}
                style={{ color: theme.secondary }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            ) : null}
            {authLoading ? (
              <span className="text-xs text-text-muted">…</span>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => go("account")}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[8rem] truncate">{user.name || user.email}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-text-muted hover:bg-muted"
                  title="Sign out of this shop only"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go("login")}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => go("signup")}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold"
                  style={{ background: theme.primary, color: theme.onPrimary }}
                >
                  Join
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tour stays mounted across pages (including login/admin steps) */}
      <AppGuidedTour
        slug={slug}
        brandName={content.brandName}
        accent={accent}
        includeAdmin={Boolean(user?.isAdmin || user?.isStaff)}
        onNavigate={go}
        forceOpen={forceTour}
        onCloseForce={() => setForceTour(false)}
      />

      {user?.viaPlatformSuperAdmin ? (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
          You are viewing as platform Super Admin with Owner access on this shop.
        </div>
      ) : null}

      {isAuthRoute ? (
        <AppAuthScreens
          slug={slug}
          brandName={content.brandName}
          city={content.city}
          tagline={content.tagline}
          logo={content.logo}
          accent={accent}
          mode={route === "signup" ? "signup" : "login"}
          publicPath={basePath}
          onSuccess={() => {
            void loadMe().then(() => {
              // After login: staff/admin → dashboard, customers → shop home
              void fetch(`/api/apps/${slug}/auth/me`)
                .then((r) => r.json())
                .then((data: { user?: AppUserView | null }) => {
                  if (data.user?.isAdmin || data.user?.isStaff) go("admin");
                  else go("home");
                })
                .catch(() => go("home"));
            });
          }}
          onSwitch={(mode) => go(mode === "signup" ? "signup" : "login")}
          onBrowseShop={() => go("home")}
        />
      ) : null}

      {isAdminRoute && user?.isAdmin ? (
        <AppAdminPanel
          slug={slug}
          content={content}
          accent={accent}
          user={user}
          section={route}
          onSection={go}
          onContentUpdated={setContent}
        />
      ) : null}

      {isAdminRoute && user && !user.isAdmin && user.isStaff ? (
        <AppAdminPanel
          slug={slug}
          content={content}
          accent={accent}
          user={user}
          section={route === "admin" ? "admin-orders" : route}
          onSection={go}
          onContentUpdated={setContent}
          staffOnly
        />
      ) : null}

      {isAdminRoute && !user?.isAdmin && !user?.isStaff ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-lg font-semibold">Admin access required</p>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in with an Owner, Manager, or Staff account for this shop.
          </p>
          <button
            type="button"
            onClick={() => go("login")}
            className="mt-6 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            Sign in
          </button>
        </div>
      ) : null}

      {route === "account" && user ? (
        <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
          <h1 className="text-2xl font-semibold">My account</h1>
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <p>
              <span className="text-text-muted">Name:</span> {user.name}
            </p>
            <p className="mt-2">
              <span className="text-text-muted">Email:</span> {user.email}
            </p>
            <p className="mt-2">
              <span className="text-text-muted">Role:</span> {user.roleLabel}
            </p>
          </div>
          <p className="text-xs text-text-muted">
            This account is only for <strong>{content.brandName}</strong> — separate from any other
            website logins.
          </p>
          <button
            type="button"
            onClick={() => go("shop")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            <ShoppingBag className="h-4 w-4" />
            Continue shopping
          </button>
        </div>
      ) : null}

      {route === "account" && !user && !authLoading ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-semibold">Please sign in</p>
          <button
            type="button"
            onClick={() => go("login")}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            Sign in
          </button>
        </div>
      ) : null}

      {!isAuthRoute && !isAdminRoute && route !== "account" ? (
        <EcomLocalShopApp
          content={content}
          basePath={basePath}
          pathSegments={shopPathSeg}
          embedded
          onNavigate={(page) => {
            if (page === "home") go("home");
            else if (page === "shop" || page === "about" || page === "faq" || page === "contact") {
              go(page);
            }
          }}
          slug={slug}
          appUser={user}
        />
      ) : null}

      {/* Footer on account / auth pages (shop pages include their own footer) */}
      {(isAuthRoute || route === "account") && !isAdminRoute ? (
        <AppBuilderFooter content={content} theme={theme} onNavigate={(p) => go(p)} />
      ) : null}
    </div>
  );
}
