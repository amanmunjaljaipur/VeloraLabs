"use client";

/**
 * Per-demo authentication gate.
 * Each /demo-apps/{slug} is its own app: signup/login isolated by slug,
 * session persists in localStorage, app_admin can switch every product role.
 */

import { StudioWorkingApp } from "@/components/app-studio/StudioWorkingApp";
import { StoreStudio } from "@/components/demo-stores/StoreStudio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  getDemoSession,
  loginDemoUser,
  logoutDemoUser,
  signupDemoUser,
  type DemoAppSession,
} from "@/lib/demo-apps/demo-auth";
import type { StudioAppSpec } from "@/lib/app-studio/types";
import type { StoreCategoryId } from "@/lib/demo-stores/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  Shield,
  Store,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Mode = "login" | "signup";

export function DemoAuthShell({
  slug,
  spec,
  categoryName,
}: {
  slug: string;
  spec: StudioAppSpec;
  categoryName?: string;
}) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<DemoAppSession | null>(null);
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);

  const refresh = useCallback(async () => {
    const local = getDemoSession(slug);
    if (local) {
      setSession(local);
      setReady(true);
      return;
    }

    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = (await res.json()) as { user?: { email?: string; name?: string } };
        if (data?.user?.email) {
          const userObj = {
            id: `sso-${Date.now()}`,
            email: data.user.email,
            name: data.user.name || data.user.email.split("@")[0],
            access: "app_admin" as const,
          };
          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          const ssoSession = {
            userId: userObj.id,
            email: userObj.email,
            name: userObj.name,
            access: userObj.access,
            slug,
            expiresAt: expires.toISOString(),
          };
          localStorage.setItem(`vl-demo-session:v1:${slug}`, JSON.stringify(ssoSession));
          setSession(ssoSession);
        }
      }
    } catch (err) {
      console.warn("Demo SSO auto-login failed", err);
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // small delay so UI feels intentional
    await new Promise((r) => setTimeout(r, 280));
    const res =
      mode === "signup"
        ? signupDemoUser(slug, {
            name,
            email,
            password,
            asAdmin: true, // demos: every signup can test all roles
          })
        : loginDemoUser(slug, { email, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSession(res.session);
    setPassword("");
  }

  function onLogout() {
    logoutDemoUser(slug);
    setSession(null);
    setShowAccount(false);
    setMode("login");
  }

  if (!ready) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent-teal" />
      </div>
    );
  }

  // ── Authenticated: full product + session chrome ──────────────────────
  if (session) {
    if (studioOpen && session.access === "app_admin") {
      const catMap: Record<string, StoreCategoryId> = {
        "mass-marketplace": "mass-marketplace",
        "food-delivery": "food-delivery",
        "grocery-qcommerce": "grocery-qcommerce",
        "brand-shopping": "brand-shopping",
        "secondhand-marketplace": "secondhand-marketplace",
        "loyalty-cashback": "loyalty-cashback",
        "digital-banking": "digital-banking",
      };
      return (
        <StoreStudio
          session={session}
          sourceDemoSlug={slug}
          defaultCategory={catMap[slug] || "mass-marketplace"}
          defaultBrand={spec.brandName}
          onClose={() => setStudioOpen(false)}
        />
      );
    }

    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* Thin session bar - product stays primary */}
        <div className="z-40 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card/90 px-3 py-1.5 text-xs backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{ background: spec.primaryColor || "#0f2744" }}
            >
              {spec.brandName.slice(0, 1)}
            </span>
            <span className="truncate font-semibold text-foreground">
              {spec.brandName}
            </span>
            <span className="hidden text-muted-foreground sm:inline">· signed in</span>
          </div>
          <div className="flex items-center gap-2">
            {session.access === "app_admin" && (
              <>
                <button
                  type="button"
                  onClick={() => setStudioOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 font-medium text-white hover:bg-navy-muted"
                >
                  <Store className="h-3 w-3" /> Store Super Admin
                </button>
                <span className="hidden items-center gap-1 rounded-full bg-accent-teal/15 px-2 py-0.5 font-medium text-accent-teal sm:inline-flex">
                  <Shield className="h-3 w-3" /> All roles
                </span>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowAccount((v) => !v)}
              className="inline-flex max-w-[10rem] items-center gap-1 truncate rounded-lg border border-border px-2 py-1 font-medium hover:bg-muted"
            >
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{session.name}</span>
            </button>
          </div>
        </div>

        {showAccount && (
          <div className="absolute top-10 right-3 z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm font-semibold">{session.name}</p>
            <p className="text-xs text-muted-foreground">{session.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Access:{" "}
              <strong className="text-foreground">
                {session.access === "app_admin" ? "App admin / store owner" : "Member"}
              </strong>
            </p>
            {session.access === "app_admin" && (
              <>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Switch product roles in-app to test workflows. Open Store Super Admin to brand,
                  CMS, CRM, chatbot, and publish permanent /s/… stores.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="cta"
                  className="mt-2 w-full"
                  onClick={() => {
                    setShowAccount(false);
                    setStudioOpen(true);
                  }}
                >
                  <Store className="h-3.5 w-3.5" /> Open Store Super Admin
                </Button>
              </>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              Session for <strong>{slug}</strong> only - other demo apps need their own login.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              onClick={onLogout}
            >
              <LogOut className="h-3.5 w-3.5" /> Log out of {spec.brandName}
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StudioWorkingApp
            spec={spec}
            fullScreen
            className="h-full min-h-0 flex-1 overflow-hidden"
            sessionAccess={session.access}
            sessionName={session.name}
          />
        </div>
      </div>
    );
  }

  // ── Login / Signup (branded per app) ──────────────────────────────────
  const primary = spec.primaryColor || "#0f2744";
  const accent = spec.accentColor || "#0d9488";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <div
        className="shrink-0 px-4 py-8 text-white md:px-8 md:py-12"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, #1e293b 55%, ${accent} 160%)`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {categoryName || "Product app"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {spec.brandName}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/80">
          {spec.tagline || "Sign in to use this app"}
        </p>
        <p className="mt-3 max-w-md text-xs text-white/60">
          Separate account for this app only. Your login does not open other demos.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="mb-4 flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold",
              mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold",
              mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            Log in
          </button>
        </div>

        <Card className="space-y-4 p-5 shadow-sm">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 text-accent-teal" />
            <div>
              <p className="text-sm font-semibold">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === "signup"
                  ? "You’ll get app admin access so you can switch roles and test every workflow."
                  : `Log in to continue with ${spec.brandName}.`}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <label className="block text-sm">
                <span className="font-medium">Full name</span>
                <Input
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="font-medium">Email</span>
              <Input
                className="mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Password</span>
              <Input
                className="mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-100">
                {error}
              </p>
            )}

            <Button type="submit" variant="cta" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signup" ? "Create account & enter app" : "Log in"}
            </Button>
          </form>

          {mode === "signup" && (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                Stays logged in on this device (30 days)
              </li>
              <li className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                App admin: switch all roles and test full workflows
              </li>
              <li className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                Account is private to <strong className="text-foreground">{spec.brandName}</strong>
              </li>
            </ul>
          )}
        </Card>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Demo authentication stored in your browser only. Not linked to Verlin Labs site login.
        </p>
      </div>
    </div>
  );
}
