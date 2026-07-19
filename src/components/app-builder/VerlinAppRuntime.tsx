"use client";

/**
 * App Builder V2 runtime - renders generated products with Verlin Labs'
 * real UI components (Button, Card, Input, Select, SectionHeader, Badge)
 * instead of a per-app generated colour theme. Every "intake" style page
 * (apply, book, sign up, get a quote, contact, ...) is a real form wired to
 * a live submit endpoint, so the product works end to end regardless of
 * what the user described in their prompt - not just for a fixed list of
 * verticals.
 */

import { AppAuthScreens } from "@/components/app-builder/AppAuthScreens";
import { GenericDataAdmin } from "@/components/app-builder/GenericDataAdmin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { VerlinBrandMark } from "@/components/ui/VerlinBrandMark";
import type { AppDataModelSpec, GenericAppContent, GenericAppPage } from "@/lib/app-builder/types";
import { CheckCircle2, LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface AppUserView {
  email: string;
  name: string;
  roleId: string;
  roleLabel: string;
  isStaff: boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

type Route = "home" | "page" | "login" | "signup" | "account" | "admin";

const INTAKE_KEYWORDS = /(apply|onboard|book|sign.?up|register|join|inquir|quote|get.?started|contact|request|subscribe|enroll|order)/i;

function detectIntakePage(page: GenericAppPage): boolean {
  return INTAKE_KEYWORDS.test(`${page.path} ${page.title}`);
}

/** Best-effort match between an intake page and one of the plan's data models. */
function pickModelForPage(page: GenericAppPage, models: AppDataModelSpec[] | undefined): AppDataModelSpec | null {
  if (!models?.length) return null;
  const tokens = `${page.path} ${page.title}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let best: { model: AppDataModelSpec; score: number } | null = null;
  for (const m of models) {
    const mTokens = m.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const score = tokens.filter((t) => mTokens.some((mt) => mt.includes(t) || t.includes(mt))).length;
    if (score > 0 && (!best || score > best.score)) best = { model: m, score };
  }
  return best?.model || null;
}

function inputTypeFor(type: string): string {
  switch (type) {
    case "number":
    case "money":
      return "number";
    case "date":
      return "date";
    case "email":
      return "email";
    case "url":
      return "url";
    default:
      return "text";
  }
}

/** Real form for an intake page, backed by a data model - creates a genuine record. */
function ModelIntakeForm({
  slug,
  model,
  accentLabel,
}: {
  slug: string;
  model: AppDataModelSpec;
  accentLabel: string;
}) {
  const fields = useMemo(() => model.fields.filter((f) => f.type !== "relation").slice(0, 8), [model]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`/api/apps/${slug}/data/${model.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit");
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 text-lg font-semibold">Received</p>
        <p className="mt-1 text-sm text-text-secondary">
          Your {accentLabel.toLowerCase()} was submitted. We&apos;ll follow up soon.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => { setStatus("idle"); setValues({}); }}>
          Submit another
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {fields.map((f) =>
          f.type === "boolean" ? (
            <Select
              key={f.name}
              label={f.name}
              options={[
                { value: "", label: "Select…" },
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              required={f.required}
            />
          ) : (
            <Input
              key={f.name}
              label={`${f.name}${f.required ? " *" : ""}`}
              type={inputTypeFor(f.type)}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              required={f.required}
            />
          )
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" loading={status === "sending"} className="w-full">
          Submit
        </Button>
      </form>
    </Card>
  );
}

/** Fallback intake form when the plan has no matching data model - a real contact/inquiry. */
function InquiryIntakeForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`/api/apps/${slug}/admin/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 text-lg font-semibold">Message sent</p>
        <p className="mt-1 text-sm text-text-secondary">We&apos;ll get back to you soon.</p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Message *</span>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" loading={status === "sending"} className="w-full">
          Send
        </Button>
      </form>
    </Card>
  );
}

export function VerlinAppRuntime({
  content,
  slug,
  dataModels,
  pathSegments = [],
}: {
  content: GenericAppContent;
  slug: string;
  dataModels?: AppDataModelSpec[];
  pathSegments?: string[];
}) {
  const [pageKey, setPageKey] = useState(pathSegments[0] || "home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<AppUserView | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${slug}/auth/me`);
      const data = (await res.json()) as { user: AppUserView | null };
      setUser(res.ok ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const go = useCallback((key: string) => {
    setPageKey(key);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleLogout() {
    await fetch(`/api/apps/${slug}/auth/logout`, { method: "POST" });
    setUser(null);
    go("home");
  }

  const route: Route =
    pageKey === "login" ? "login" : pageKey === "signup" ? "signup" : pageKey === "account" ? "account" : pageKey === "admin" ? "admin" : pageKey === "home" ? "home" as Route : "page";

  const page = content.pages.find((p) => p.path === pageKey || p.id === pageKey) || content.pages.find((p) => p.path === "home");
  const isHome = route === "home" || (route === "page" && page?.path === "home");
  const isIntake = page && route === "page" ? detectIntakePage(page) : false;
  const matchedModel = isIntake ? pickModelForPage(page!, dataModels) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => go("home")}
            className="text-left text-lg font-semibold tracking-tight text-foreground hover:opacity-90"
          >
            {content.brandName}
          </button>
          <nav className="flex flex-wrap gap-1 text-sm font-medium" aria-label="App pages">
            {content.pages.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => go(p.path)}
                className={`rounded-lg px-2.5 py-1.5 ${pageKey === p.path ? "bg-accent-teal/10 text-accent-teal" : "text-text-secondary hover:text-foreground"}`}
              >
                {p.title}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {user?.isAdmin || user?.isStaff ? (
              <Button variant="secondary" size="sm" onClick={() => go("admin")}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            ) : null}
            {authLoading ? null : user ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => go("account")}>
                  <User className="h-4 w-4" /> {user.name || user.email}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={() => go("login")}>
                <LogIn className="h-4 w-4" /> Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {route === "login" || route === "signup" ? (
        <AppAuthScreens
          slug={slug}
          brandName={content.brandName}
          city={content.city}
          tagline={content.tagline}
          logo={content.logo}
          accent="#0d9488"
          mode={authMode || route}
          publicPath={`/apps/${slug}`}
          onSuccess={() => {
            void loadMe();
            go("home");
          }}
          onSwitch={(m) => {
            setAuthMode(m);
            go(m);
          }}
          onBrowseShop={() => go("home")}
        />
      ) : null}

      {route === "account" && user ? (
        <div className="mx-auto max-w-lg flex-1 px-4 py-16">
          <Card>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-text-secondary">{user.email}</p>
            <Badge className="mt-3">{user.roleLabel || user.roleId}</Badge>
            <Button variant="secondary" className="mt-6 w-full" onClick={() => void handleLogout()}>
              Sign out
            </Button>
          </Card>
        </div>
      ) : null}

      {route === "admin" ? (
        user?.isAdmin || user?.isStaff ? (
          <GenericDataAdmin
            slug={slug}
            dataModels={dataModels || []}
            accent="#0d9488"
            canManage
            onBack={() => go("home")}
          />
        ) : (
          <div className="mx-auto max-w-lg flex-1 px-4 py-16 text-center">
            <p className="text-lg font-semibold">Admin access required</p>
            <p className="mt-2 text-sm text-text-secondary">Sign in with an owner or staff account.</p>
            <Button className="mt-6" onClick={() => go("login")}>Sign in</Button>
          </div>
        )
      ) : null}

      {isHome ? (
        <>
          <section className="border-b border-border bg-gradient-to-br from-navy to-navy-muted px-4 py-16 text-white md:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="bg-white/15 text-white">{content.appKind.replace(/-/g, " ")}</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{content.heroHeadline}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 md:text-lg">{content.heroSubheadline}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={() => go(content.pages.find((p) => p.path !== "home")?.path || "features")}
                >
                  {content.ctaLabel}
                </Button>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl flex-1 px-4 py-14">
            <h2 className="section-title text-center">Highlights</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(content.features || []).map((f) => (
                <Card key={f.id} hover>
                  <p className="text-2xl" aria-hidden>{f.icon || "✨"}</p>
                  <h3 className="mt-2 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{f.body}</p>
                </Card>
              ))}
            </div>
            {content.trustBadges?.length ? (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {content.trustBadges.map((b) => (
                  <Badge key={b}>{b}</Badge>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {route === "page" && page && !isHome ? (
        <section className="mx-auto max-w-2xl flex-1 px-4 py-14">
          <button
            type="button"
            onClick={() => go("home")}
            className="mb-4 text-xs font-medium text-accent-teal underline"
          >
            ← Back to home
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{page.headline || page.title}</h1>

          {isIntake ? (
            <div className="mt-6">
              {matchedModel ? (
                <ModelIntakeForm slug={slug} model={matchedModel} accentLabel={page.title} />
              ) : (
                <InquiryIntakeForm slug={slug} />
              )}
            </div>
          ) : (
            <Card className="mt-6">
              <div
                className="prose prose-sm max-w-none text-text-secondary dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: (page.bodyHtml || "")
                    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
                    .replace(/\son\w+\s*=/gi, " data-x="),
                }}
              />
            </Card>
          )}

          {page.path === "faq" && content.faqs?.length ? (
            <div className="mt-6 space-y-3">
              {content.faqs.map((f, i) => (
                <Card key={i}>
                  <h2 className="font-semibold">{f.question}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{f.answer}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-auto border-t border-border bg-card px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-text-secondary">
          <p>{content.footerNote}</p>
          <Link
            href="https://verlinlabs.com"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-teal"
          >
            <VerlinBrandMark className="h-4 w-4" />
            Built with Verlin Labs
          </Link>
        </div>
      </footer>
    </div>
  );
}
