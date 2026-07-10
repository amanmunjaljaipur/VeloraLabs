"use client";

/**
 * Multi-module interactive demo runtime for all verticals.
 * Role selector top-right · module nav · list/board/form/dashboard · mock API create/status.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { mockApiCall, type MockPathMode } from "@/lib/app-studio/mock-api";
import type {
  StudioAppSpec,
  StudioEntity,
  StudioNavItem,
  StudioRole,
  StudioScreen,
} from "@/lib/app-studio/types";
import {
  panelContent,
  resolveNavScreenId,
} from "@/lib/demo-apps/industry-shells";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Compass,
  Folder,
  Gift,
  Heart,
  HelpCircle,
  Home,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  Map,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  UserRound,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  message: MessageSquare,
  compass: Compass,
  bell: Bell,
  user: User,
  search: Search,
  library: BookOpen,
  plus: Plus,
  send: Send,
  wallet: Wallet,
  list: List,
  menu: Menu,
  package: Package,
  cart: ShoppingCart,
  layout: LayoutGrid,
  folder: Folder,
  settings: Settings,
  check: CheckCircle2,
  inbox: Inbox,
  users: Users,
  shield: Shield,
  map: Map,
  book: BookOpen,
  chart: LayoutGrid,
  heart: Heart,
  gift: Gift,
  card: Wallet,
  car: Map,
  calendar: List,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && NAV_ICONS[name]) || CircleDot;
  return <Icon className={className || "h-4 w-4"} />;
}

type Row = Record<string, unknown> & { id: string };
type ToastKind = "success" | "error" | "info";

function seed(entity: StudioEntity): Row[] {
  return (entity.seed || []).map((r, i) => ({
    id: `seed-${entity.id}-${i}`,
    ...r,
  }));
}

function titleOf(r: Row, fallback = "Item") {
  return String(r.title || r.name || r.memberName || r.classTitle || fallback);
}

export function MultiModuleProductApp({
  spec,
  role,
  roleId,
  onRoleChange,
  fullScreen,
}: {
  spec: StudioAppSpec;
  role?: StudioRole;
  roleId: string;
  onRoleChange: (id: string) => void;
  fullScreen?: boolean;
}) {
  const visibleScreens = useMemo(
    () =>
      spec.screens.filter((s) => !s.roleIds?.length || s.roleIds.includes(roleId)),
    [spec.screens, roleId]
  );

  const [screenId, setScreenId] = useState(
    () =>
      visibleScreens.find((s) => s.type !== "settings")?.id ||
      visibleScreens[0]?.id ||
      ""
  );
  const activeScreen: StudioScreen | undefined =
    visibleScreens.find((s) => s.id === screenId) || visibleScreens[0];

  const [data, setData] = useState<Record<string, Row[]>>(() => {
    const init: Record<string, Row[]> = {};
    for (const e of spec.entities) init[e.id] = seed(e);
    return init;
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [pathMode, setPathMode] = useState<MockPathMode>("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    NonNullable<StudioNavItem["panel"]> | null
  >(null);

  const shell = spec.shell;
  const moduleIds = useMemo(
    () => new Set(spec.screens.map((s) => s.id)),
    [spec.screens]
  );

  const workflowsForRole = spec.workflows.filter((w) => w.roleId === roleId);
  const entityMap = Object.fromEntries(spec.entities.map((e) => [e.id, e]));
  const primaryEntity = spec.entities[0];

  function navVisible(item: StudioNavItem) {
    if (!item.roleIds?.length) return true;
    return item.roleIds.includes(roleId);
  }

  function activateNav(item: StudioNavItem) {
    setMoreOpen(false);
    if (item.panel) {
      setActivePanel(item.panel);
      return;
    }
    setActivePanel(null);
    const resolved = resolveNavScreenId(item.screenId || item.id, moduleIds);
    if (resolved) setScreenId(resolved);
  }

  const primaryNav = (shell?.primaryNav || []).filter(navVisible);
  const moreNav = (shell?.moreNav || []).filter(navVisible);
  const utilityNav = (shell?.utilityNav || []).filter(navVisible);
  const useSidebar =
    shell?.navPattern === "sidebar" || shell?.navPattern === "hybrid";

  useEffect(() => {
    setActivePanel(null);
  }, [roleId]);

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3200);
  }

  function switchRole(id: string) {
    onRoleChange(id);
    const next = spec.screens.filter((s) => !s.roleIds?.length || s.roleIds.includes(id));
    setScreenId(next.find((s) => s.type !== "settings")?.id || next[0]?.id || "");
    setForm({});
    setFormErrors({});
  }

  function validateForm(entity: StudioEntity): boolean {
    const err: Record<string, string> = {};
    for (const f of entity.fields) {
      if (f.type === "status") continue;
      const v = (form[f.key] || "").trim();
      if (f.required && !v) err[f.key] = `${f.label} is required`;
      if (f.type === "number" && v && Number.isNaN(Number(v))) {
        err[f.key] = `${f.label} must be a number`;
      }
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        err[f.key] = "Invalid email";
      }
    }
    if ((form.title || "").toLowerCase().includes("fail")) {
      err.title = "Title cannot contain “fail” (negative test)";
    }
    setFormErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return false;
    }
    return true;
  }

  async function createRecord(entityId: string) {
    const entity = entityMap[entityId];
    if (!entity) return;
    if (!role?.canCreate) {
      flash("Your role cannot create records — switch role top-right", "error");
      return;
    }
    if (!validateForm(entity)) return;

    setBusy(`create-${entityId}`);
    const res = await mockApiCall({
      endpoint: `POST /mock/${entityId}`,
      mode: pathMode,
      payload: form,
      failMessage: `Create ${entity.name} failed (mock)`,
      successMessage: `${entity.name} created`,
      onSuccess: () => {
        const row: Row = {
          id: `rec-${Date.now().toString(36)}`,
          ...Object.fromEntries(
            entity.fields.map((f) => {
              let v: unknown = form[f.key] ?? "";
              if (f.type === "number") v = Number(form[f.key] || 0);
              if (f.type === "status" || f.key === "status") {
                v = form.status || entity.statuses?.[0] || "New";
              }
              return [f.key, v];
            })
          ),
        };
        if (entity.statuses?.length && row.status == null) {
          row.status = entity.statuses[0];
        }
        setData((prev) => ({
          ...prev,
          [entityId]: [row, ...(prev[entityId] || [])],
        }));
        return row;
      },
    });
    setBusy(null);
    if (!res.ok) {
      flash(`${res.error} (${res.latencyMs}ms)`, "error");
      return;
    }
    setForm({});
    setFormErrors({});
    flash(`${res.message} · mock ${res.latencyMs}ms`, "success");
    const list = visibleScreens.find(
      (s) =>
        s.entityId === entityId &&
        (s.type === "list" || s.type === "board" || s.type === "schedule")
    );
    if (list) setScreenId(list.id);
  }

  async function setStatus(entityId: string, id: string, status: string) {
    if (!role?.canManage && !role?.canCreate) {
      flash("Your role cannot change status", "error");
      return;
    }
    setBusy(`st-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /mock/${entityId}/${id}`,
      mode: pathMode,
      payload: { id, status },
      failMessage: "Status update failed (mock)",
      successMessage: `Status → ${status}`,
      onSuccess: () => {
        setData((prev) => ({
          ...prev,
          [entityId]: (prev[entityId] || []).map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
        return true;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error} (${res.latencyMs}ms)`,
      res.ok ? "success" : "error"
    );
  }

  function counts(entityId: string) {
    const entity = entityMap[entityId];
    const rows = data[entityId] || [];
    return (entity?.statuses || []).map((s) => ({
      status: s,
      count: rows.filter((r) => String(r.status) === s).length,
    }));
  }

  const panel = activePanel && shell
    ? panelContent(activePanel, spec.brandName, shell)
    : null;

  function isNavActive(item: StudioNavItem) {
    if (item.panel) return activePanel === item.panel;
    if (activePanel) return false;
    const resolved = resolveNavScreenId(item.screenId || item.id, moduleIds);
    return resolved === activeScreen?.id;
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background text-foreground",
        fullScreen
          ? "h-full max-h-full flex-1"
          : "h-full min-h-[520px] max-h-[calc(100dvh-6rem)] rounded-xl border border-border"
      )}
    >
      {/* Production app bar */}
      <header className="z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold" style={{ color: spec.primaryColor }}>
              {spec.brandName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {spec.tagline}
              {shell?.marketBenchmarks?.[0] && (
                <span className="hidden sm:inline">
                  {" "}
                  · IA: {shell.marketBenchmarks.slice(0, 2).join(", ")}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {utilityNav.slice(0, 3).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => activateNav(u)}
                className="hidden items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted sm:inline-flex"
              >
                <NavIcon name={u.icon || "settings"} className="h-3.5 w-3.5" />
                {u.label}
              </button>
            ))}
            <label className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px]">
              <span className="text-muted-foreground">API</span>
              <select
                value={pathMode}
                onChange={(e) => setPathMode(e.target.value as MockPathMode)}
                className="bg-transparent font-semibold outline-none"
              >
                <option value="auto">Auto</option>
                <option value="always_ok">Always OK</option>
                <option value="always_fail">Always fail</option>
              </select>
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-accent-teal/40 bg-accent-teal/10 px-2.5 py-1.5">
              <UserRound className="h-4 w-4 text-accent-teal" />
              <select
                value={roleId}
                onChange={(e) => switchRole(e.target.value)}
                className="max-w-[12rem] bg-transparent text-sm font-bold outline-none"
              >
                {spec.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Top tabs when not pure sidebar mobile */}
        {!useSidebar && primaryNav.length > 0 && (
          <nav className="hidden gap-1 overflow-x-auto border-t border-border/50 px-2 py-1.5 md:flex md:px-4 [scrollbar-width:thin]">
            {primaryNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateNav(item)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
                  isNavActive(item)
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
            {moreNav.length > 0 && (
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                <Menu className="h-3.5 w-3.5" /> More
              </button>
            )}
          </nav>
        )}
        {/* Fallback: all modules if no shell */}
        {!shell && (
          <nav className="flex gap-1 overflow-x-auto border-t border-border/50 px-2 py-1.5 md:px-4 [scrollbar-width:thin]">
            {visibleScreens.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActivePanel(null);
                  setScreenId(s.id);
                }}
                className={cn(
                  "inline-flex shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
                  activeScreen?.id === s.id
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {s.title}
              </button>
            ))}
          </nav>
        )}
        {role && (
          <div className="border-t border-border/50 bg-accent-teal/5 px-3 py-1.5 text-xs text-muted-foreground md:px-4">
            <span className="font-semibold text-accent-teal">Viewing as {role.label}</span>
            {" — "}
            <span className="line-clamp-1 sm:line-clamp-none">{role.description}</span>
          </div>
        )}
        {moreOpen && moreNav.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-border bg-muted/30 px-3 py-2">
            {moreNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateNav(item)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-accent-teal/40"
              >
                {item.label}
              </button>
            ))}
            {visibleScreens
              .filter((s) => !primaryNav.some((p) => resolveNavScreenId(p.screenId, moduleIds) === s.id))
              .map((s) => (
                <button
                  key={`mod-${s.id}`}
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    setActivePanel(null);
                    setScreenId(s.id);
                  }}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-accent-teal/40"
                >
                  {s.title}
                </button>
              ))}
          </div>
        )}
      </header>

      {toast && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 px-4 py-2 text-sm",
            toast.kind === "success" &&
              "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
            toast.kind === "error" &&
              "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
            toast.kind === "info" &&
              "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
          )}
        >
          {toast.kind === "success" && <CheckCircle2 className="h-4 w-4" />}
          {toast.kind === "error" && <XCircle className="h-4 w-4" />}
          {toast.kind === "info" && <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar for workplace / hybrid */}
        {useSidebar && shell && (
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
              {primaryNav.map((item, idx) => (
                <div key={item.id}>
                  {item.section &&
                    (idx === 0 || primaryNav[idx - 1]?.section !== item.section) && (
                      <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.section}
                      </p>
                    )}
                  <button
                    type="button"
                    onClick={() => activateNav(item)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                      isNavActive(item)
                        ? "bg-accent-teal/15 font-semibold text-accent-teal"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                </div>
              ))}
              {moreNav.length > 0 && (
                <>
                  <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    More
                  </p>
                  {moreNav.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => activateNav(item)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      {item.label}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="border-t border-border p-2 text-[10px] text-muted-foreground">
              {shell.iaRationale.slice(0, 120)}…
            </div>
          </aside>
        )}

        <main
          className={cn(
            "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-5 md:px-5",
            "pb-24 md:pb-5"
          )}
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            overflowY: "auto",
          }}
        >
          <div className="mx-auto w-full max-w-7xl">
        {busy && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-accent-teal/30 bg-accent-teal/10 px-3 py-2 text-xs text-accent-teal">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mock API… {busy}
          </div>
        )}

        {panel && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                  {activePanel}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">{panel.title}</h1>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setActivePanel(null)}>
                Back to app
              </Button>
            </div>
            <Card className="space-y-3 p-5">
              {panel.body.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </Card>
            {shell?.footer.disclaimers && activePanel === "legal" && (
              <Card className="border-amber-500/30 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                <p className="text-sm font-medium">Industry disclaimers</p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {shell.footer.disclaimers.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {!panel && activeScreen && activeScreen.type !== "dashboard" && (
          <div className="mb-4 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{activeScreen.title}</h1>
            {activeScreen.description && (
              <p className="max-w-3xl text-sm text-muted-foreground">{activeScreen.description}</p>
            )}
            {shell?.iaRationale && (
              <p className="max-w-3xl text-[11px] text-muted-foreground/80">
                Industry IA: {shell.marketBenchmarks.join(" · ")}
              </p>
            )}
          </div>
        )}

        {!panel && workflowsForRole.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {workflowsForRole.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setScreenId(w.screenId)}
                className="rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1 text-xs font-medium text-accent-teal hover:bg-accent-teal/20"
                title={w.description}
              >
                {w.name}
              </button>
            ))}
          </div>
        )}

        {!panel && activeScreen?.type === "dashboard" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                Learning track · {role?.label}
              </p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {spec.learning?.heroHeadline || `Welcome, ${role?.label}`}
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                {spec.learning?.heroSub || spec.description}
              </p>
              {spec.learning?.whoItsFor && (
                <p className="max-w-3xl text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Who it&apos;s for: </span>
                  {spec.learning.whoItsFor}
                </p>
              )}
            </div>

            {spec.learning?.outcomes && spec.learning.outcomes.length > 0 && (
              <Card className="border-accent-teal/25 bg-accent-teal/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent-teal" />
                  <p className="text-sm font-semibold">What you will practice</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {spec.learning.outcomes.map((o) => (
                    <li key={o} className="flex gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {primaryEntity && (
              <div className="grid gap-3 sm:grid-cols-3">
                {counts(primaryEntity.id).map((c) => (
                  <Card key={c.status} className="p-4">
                    <p className="text-xs uppercase text-muted-foreground">{c.status}</p>
                    <p className="mt-1 text-3xl font-bold text-accent-teal">{c.count}</p>
                    <p className="text-xs text-muted-foreground">{primaryEntity.namePlural}</p>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {workflowsForRole.map((w) => (
                <Button
                  key={w.id}
                  type="button"
                  variant="cta"
                  onClick={() => setScreenId(w.screenId)}
                >
                  {w.name}
                </Button>
              ))}
            </div>

            {spec.learning?.howItWorks && spec.learning.howItWorks.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-semibold">How this demo works</p>
                <ol className="grid gap-3 md:grid-cols-2">
                  {spec.learning.howItWorks.map((h, i) => (
                    <Card key={h.step} className="flex gap-3 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white dark:bg-accent-teal dark:text-navy">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{h.step}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{h.detail}</p>
                      </div>
                    </Card>
                  ))}
                </ol>
              </div>
            )}

            <Card className="p-4">
              <p className="text-sm font-medium">Roles in this product</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {spec.roles.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                    <span>
                      <strong className="text-foreground">{r.label}</strong> — {r.description}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {spec.learning?.trustLines && spec.learning.trustLines.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {spec.learning.trustLines.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                  >
                    <ShieldCheck className="h-3 w-3 text-accent-teal" />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {spec.learning?.faqs && spec.learning.faqs.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">FAQ</p>
                {spec.learning.faqs.map((f) => (
                  <Card key={f.question} className="p-4">
                    <p className="text-sm font-medium text-foreground">{f.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!panel &&
          (activeScreen?.type === "list" ||
            activeScreen?.type === "schedule" ||
            activeScreen?.type === "detail") &&
          activeScreen.entityId && (
            <ListBlock
              entity={entityMap[activeScreen.entityId]}
              rows={data[activeScreen.entityId] || []}
              canManage={Boolean(role?.canManage || role?.canCreate)}
              canCreate={Boolean(role?.canCreate)}
              onStatus={(id, st) => void setStatus(activeScreen.entityId!, id, st)}
              onCreate={() => {
                const formScreen = visibleScreens.find(
                  (s) => s.type === "form" && s.entityId === activeScreen.entityId
                );
                if (formScreen) setScreenId(formScreen.id);
              }}
              busy={busy}
              emptyCopy={shell?.emptyStates?.list}
            />
          )}

        {!panel && activeScreen?.type === "board" && activeScreen.entityId && (
          <BoardBlock
            entity={entityMap[activeScreen.entityId]}
            rows={data[activeScreen.entityId] || []}
            canManage={Boolean(role?.canManage || role?.canCreate)}
            onStatus={(id, st) => void setStatus(activeScreen.entityId!, id, st)}
          />
        )}

        {!panel &&
          (activeScreen?.type === "form" ||
            activeScreen?.type === "workspace" ||
            activeScreen?.type === "transfer") &&
          activeScreen.entityId && (
            <FormBlock
              entity={entityMap[activeScreen.entityId]}
              form={form}
              setForm={setForm}
              errors={formErrors}
              canCreate={Boolean(role?.canCreate)}
              busy={busy === `create-${activeScreen.entityId}`}
              onSubmit={() => void createRecord(activeScreen.entityId!)}
              ctaLabel={shell?.ctaLabels?.create}
            />
          )}

        {!panel && activeScreen?.type === "settings" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <Card className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">Settings & demo notes</h2>
              <p className="text-sm text-muted-foreground">{spec.description}</p>
              <p className="text-sm text-muted-foreground">
                Switch roles top-right. Use the API path toggle for happy/fail demos. A title
                containing “fail” rejects creates so you can practice error UX.
              </p>
              {activeScreen.description && (
                <p className="text-sm text-muted-foreground">{activeScreen.description}</p>
              )}
            </Card>
            {spec.learning?.trustLines && (
              <Card className="space-y-2 p-5">
                <p className="text-sm font-semibold">Trust & limits</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {spec.learning.trustLines.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </Card>
            )}
            <Card className="space-y-2 p-5">
              <p className="text-sm font-semibold">Roles</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {spec.roles.map((r) => (
                  <li key={r.id}>
                    <strong className="text-foreground">{r.label}</strong> — {r.description}
                  </li>
                ))}
              </ul>
            </Card>
            {spec.learning?.faqs && spec.learning.faqs.length > 0 && (
              <Card className="space-y-3 p-5">
                <p className="text-sm font-semibold">FAQ</p>
                {spec.learning.faqs.map((f) => (
                  <div key={f.question}>
                    <p className="text-sm font-medium">{f.question}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.answer}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {workflowsForRole.length > 0 && !panel && (
          <Card className="mt-8 border-dashed p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Your workflows as {role?.label}
            </p>
            <div className="mt-3 space-y-3">
              {workflowsForRole.map((w) => (
                <div key={w.id}>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                  <ol className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    {w.steps.map((s, i) => (
                      <li key={s} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        {i + 1}. {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Industry-standard multi-column footer */}
        {shell?.footer && (
          <footer className="mt-10 border-t border-border pt-8 pb-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {shell.footer.columns.map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {col.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {col.links.map((link) => (
                      <li key={`${col.title}-${link.label}`}>
                        <button
                          type="button"
                          className="text-left text-sm text-muted-foreground hover:text-accent-teal"
                          onClick={() => {
                            if (link.panel) {
                              setActivePanel(link.panel);
                              return;
                            }
                            if (link.screenId) {
                              const id = resolveNavScreenId(link.screenId, moduleIds);
                              if (id) {
                                setActivePanel(null);
                                setScreenId(id);
                              }
                            }
                          }}
                        >
                          {link.label}
                          {link.hrefLabel && (
                            <span className="ml-1 text-[10px] opacity-70">({link.hrefLabel})</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {shell.footer.trustBadges.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {shell.footer.trustBadges.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    <ShieldCheck className="h-3 w-3 text-accent-teal" />
                    {b}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
              {shell.footer.disclaimers.map((d) => (
                <p key={d}>{d}</p>
              ))}
              <p className="pt-2 font-medium text-foreground/80">{shell.footer.copyright}</p>
              <p>{shell.footer.supportLine}</p>
              <p className="text-[10px]">
                Role: {role?.label} · {visibleScreens.length} modules · Verlin Labs interactive demo
              </p>
            </div>
          </footer>
        )}
        {!shell && (
          <footer className="mt-8 border-t border-border pt-4 text-center text-[10px] text-muted-foreground">
            {spec.brandName} · Verlin Labs demo · {visibleScreens.length} modules · Role:{" "}
            {role?.label}
          </footer>
        )}
          </div>
        </main>
      </div>

      {/* Material-style bottom navigation (mobile / consumer apps) */}
      {shell && primaryNav.length >= 3 && (
        <nav
          className={cn(
            "z-40 flex shrink-0 border-t border-border bg-card/95 backdrop-blur safe-area-pb",
            useSidebar ? "md:hidden" : "md:hidden"
          )}
          aria-label="Primary"
        >
          {primaryNav.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => activateNav(item)}
              className={cn(
                "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                isNavActive(item) ? "text-accent-teal" : "text-muted-foreground"
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function ListBlock({
  entity,
  rows,
  canManage,
  canCreate,
  onStatus,
  onCreate,
  busy,
  emptyCopy,
}: {
  entity?: StudioEntity;
  rows: Row[];
  canManage: boolean;
  canCreate: boolean;
  onStatus: (id: string, status: string) => void;
  onCreate: () => void;
  busy: string | null;
  emptyCopy?: string;
}) {
  if (!entity) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{entity.namePlural}</h2>
        {canCreate && (
          <Button type="button" size="sm" variant="cta" onClick={onCreate}>
            <Plus className="h-4 w-4" /> New {entity.name}
          </Button>
        )}
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {emptyCopy || "No records yet. Create one to start the workflow."}
        </p>
      )}
      {rows.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{titleOf(r, entity.name)}</p>
            <p className="text-xs text-muted-foreground">
              {entity.fields
                .filter((f) => f.key !== "title" && f.key !== "status")
                .slice(0, 3)
                .map((f) => `${f.label}: ${String(r[f.key] ?? "—")}`)
                .join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted">{String(r.status || "—")}</Badge>
            {canManage && entity.statuses && (
              <select
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                value={String(r.status || entity.statuses[0])}
                disabled={Boolean(busy)}
                onChange={(e) => onStatus(r.id, e.target.value)}
              >
                {entity.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function BoardBlock({
  entity,
  rows,
  canManage,
  onStatus,
}: {
  entity?: StudioEntity;
  rows: Row[];
  canManage: boolean;
  onStatus: (id: string, status: string) => void;
}) {
  if (!entity) return null;
  const statuses = entity.statuses || ["New", "Done"];
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <LayoutGrid className="h-5 w-5" /> {entity.namePlural}
      </h2>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {statuses.map((status) => (
          <div
            key={status}
            className="min-h-[160px] rounded-xl border border-border bg-muted/30 p-3"
          >
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
              {status} ({rows.filter((r) => String(r.status) === status).length})
            </p>
            <div className="space-y-2">
              {rows
                .filter((r) => String(r.status) === status)
                .map((r) => (
                  <Card key={r.id} className="p-3">
                    <p className="text-sm font-semibold">{titleOf(r, entity.name)}</p>
                    {canManage && (
                      <select
                        className="mt-2 w-full rounded border border-border bg-background px-1 py-1 text-[11px]"
                        value={status}
                        onChange={(e) => onStatus(r.id, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            Move to {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormBlock({
  entity,
  form,
  setForm,
  errors,
  canCreate,
  busy,
  onSubmit,
  ctaLabel,
}: {
  entity?: StudioEntity;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  errors: Record<string, string>;
  canCreate: boolean;
  busy: boolean;
  onSubmit: () => void;
  ctaLabel?: string;
}) {
  if (!entity) return null;
  if (!canCreate) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Your role cannot create {entity.namePlural.toLowerCase()}. Switch role (top right).
      </Card>
    );
  }
  return (
    <Card className="max-w-lg space-y-4 p-6">
      <h2 className="text-lg font-semibold">{ctaLabel || `New ${entity.name}`}</h2>
      <p className="text-xs text-muted-foreground">
        Required fields validated. Title with “fail” or API=Always fail exercises error path.
      </p>
      {entity.fields
        .filter((f) => f.type !== "status")
        .map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form[f.key] || ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            ) : f.type === "select" ? (
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form[f.key] || f.options?.[0] || ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              >
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                className="mt-1"
                value={form[f.key] || ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
            {errors[f.key] && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors[f.key]}</p>
            )}
          </label>
        ))}
      <Button type="button" variant="cta" disabled={busy} onClick={onSubmit}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {ctaLabel || `Create ${entity.name}`}
      </Button>
    </Card>
  );
}
