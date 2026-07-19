"use client";

/**
 * Production-style multi-module runtime.
 * Every screen, button, and form is wired: create / edit / delete / status /
 * search / filter / navigate - with mock API happy & fail paths.
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
  Copy,
  Folder,
  Gift,
  Heart,
  Home,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  Map,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  User,
  UserRound,
  Users,
  Wallet,
  X,
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

type Row = Record<string, unknown> & { id: string };
type ToastKind = "success" | "error" | "info";
type FormMode = null | "create" | "edit";

function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && NAV_ICONS[name]) || CircleDot;
  return <Icon className={className || "h-4 w-4"} />;
}

function seed(entity: StudioEntity): Row[] {
  return (entity.seed || []).map((r, i) => ({
    id: `seed-${entity.id}-${i}`,
    ...r,
  }));
}

function titleOf(r: Row, fallback = "Item") {
  return String(r.title || r.name || r.memberName || r.classTitle || fallback);
}

function defaultForm(entity: StudioEntity): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of entity.fields) {
    if (f.type === "status") {
      out.status = entity.statuses?.[0] || "New";
      continue;
    }
    if (f.type === "select" && f.options?.[0]) out[f.key] = f.options[0];
    else if (f.type === "number") out[f.key] = "";
    else out[f.key] = "";
  }
  return out;
}

function rowToForm(entity: StudioEntity, row: Row): Record<string, string> {
  const out = defaultForm(entity);
  for (const f of entity.fields) {
    const v = row[f.key];
    if (v != null) out[f.key] = String(v);
  }
  if (row.status != null) out.status = String(row.status);
  return out;
}

/** Every screen resolves to an entity so list/form never go blank. */
function entityForScreen(
  screen: StudioScreen | undefined,
  entities: StudioEntity[]
): StudioEntity | undefined {
  if (!entities.length) return undefined;
  if (screen?.entityId) {
    return entities.find((e) => e.id === screen.entityId) || entities[0];
  }
  return entities[0];
}

export function MultiModuleProductApp({
  spec,
  role,
  roleId,
  onRoleChange,
  fullScreen,
  canSwitchRoles = true,
}: {
  spec: StudioAppSpec;
  role?: StudioRole;
  roleId: string;
  onRoleChange: (id: string) => void;
  fullScreen?: boolean;
  canSwitchRoles?: boolean;
  sessionName?: string;
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
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formEntityId, setFormEntityId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [pathMode, setPathMode] = useState<MockPathMode>("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    NonNullable<StudioNavItem["panel"]> | null
  >(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shell = spec.shell;
  const moduleIds = useMemo(
    () => new Set(spec.screens.map((s) => s.id)),
    [spec.screens]
  );

  const workflowsForRole = spec.workflows.filter((w) => w.roleId === roleId);
  const entityMap = Object.fromEntries(spec.entities.map((e) => [e.id, e]));
  const primaryEntity = spec.entities[0];
  const activeEntity = entityForScreen(activeScreen, spec.entities);
  const activeEntityId = activeEntity?.id;

  function navVisible(item: StudioNavItem) {
    if (!item.roleIds?.length) return true;
    return item.roleIds.includes(roleId);
  }

  function activateNav(item: StudioNavItem) {
    setMoreOpen(false);
    setSelectedId(null);
    if (item.panel) {
      setActivePanel(item.panel);
      flash(`Opened ${item.label}`, "info");
      return;
    }
    setActivePanel(null);
    const resolved = resolveNavScreenId(item.screenId || item.id, moduleIds);
    if (resolved) {
      setScreenId(resolved);
      setQuery("");
      setStatusFilter("all");
    } else {
      flash(`No screen mapped for “${item.label}” - opened Home`, "info");
      const home = visibleScreens.find((s) => s.type === "dashboard") || visibleScreens[0];
      if (home) setScreenId(home.id);
    }
  }

  const primaryNav = (shell?.primaryNav || []).filter(navVisible);
  const moreNav = (shell?.moreNav || []).filter(navVisible);
  const utilityNav = (shell?.utilityNav || []).filter(navVisible);
  const useSidebar =
    shell?.navPattern === "sidebar" || shell?.navPattern === "hybrid";

  useEffect(() => {
    setActivePanel(null);
    setFormMode(null);
    setSelectedId(null);
    setQuery("");
    setStatusFilter("all");
  }, [roleId]);

  // Keep screen valid when role changes modules
  useEffect(() => {
    if (!visibleScreens.some((s) => s.id === screenId) && visibleScreens[0]) {
      setScreenId(visibleScreens[0].id);
    }
  }, [visibleScreens, screenId]);

  function flash(msg: string, kind: ToastKind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  function switchRole(id: string) {
    onRoleChange(id);
    const next = spec.screens.filter((s) => !s.roleIds?.length || s.roleIds.includes(id));
    setScreenId(next.find((s) => s.type !== "settings")?.id || next[0]?.id || "");
    setForm({});
    setFormErrors({});
    setFormMode(null);
    flash(`Switched to ${spec.roles.find((r) => r.id === id)?.label || id}`, "info");
  }

  function openCreate(entityId?: string) {
    const ent = entityMap[entityId || activeEntityId || primaryEntity?.id || ""];
    if (!ent) {
      flash("No data model available to create", "error");
      return;
    }
    if (!role?.canCreate) {
      flash(`“${role?.label || "This role"}” cannot create - switch role to a creator/admin`, "error");
      return;
    }
    setFormEntityId(ent.id);
    setEditingId(null);
    setForm(defaultForm(ent));
    setFormErrors({});
    setFormMode("create");
  }

  function openEdit(entityId: string, row: Row) {
    const ent = entityMap[entityId];
    if (!ent) return;
    if (!role?.canManage && !role?.canCreate) {
      flash("Your role cannot edit records", "error");
      return;
    }
    setFormEntityId(entityId);
    setEditingId(row.id);
    setForm(rowToForm(ent, row));
    setFormErrors({});
    setFormMode("edit");
    setSelectedId(row.id);
  }

  function closeForm() {
    setFormMode(null);
    setEditingId(null);
    setFormErrors({});
  }

  function validateForm(entity: StudioEntity): boolean {
    const err: Record<string, string> = {};
    const fields = entity.fields.filter((f) => f.type !== "status");
    // Ensure at least title/name required for quality
    const hasRequired = fields.some((f) => f.required);
    for (const f of fields) {
      const v = (form[f.key] || "").trim();
      const must =
        f.required ||
        (!hasRequired && (f.key === "title" || f.key === "name"));
      if (must && !v) err[f.key] = `${f.label} is required`;
      if (f.type === "number" && v && Number.isNaN(Number(v))) {
        err[f.key] = `${f.label} must be a number`;
      }
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        err[f.key] = "Enter a valid email";
      }
      if (f.type === "phone" && v && v.replace(/\D/g, "").length < 8) {
        err[f.key] = "Enter a valid phone number";
      }
    }
    const blob = Object.values(form).join(" ").toLowerCase();
    if (/\bfail\b/.test(blob) || (form.title || "").toLowerCase().includes("fail")) {
      err[fields[0]?.key || "title"] =
        "Contains “fail” - used to exercise the error path. Remove it or set Always succeed in Settings.";
    }
    setFormErrors(err);
    if (Object.keys(err).length) {
      flash(Object.values(err)[0], "error");
      return false;
    }
    return true;
  }

  function buildRow(entity: StudioEntity, id: string): Row {
    const row: Row = { id };
    for (const f of entity.fields) {
      let v: unknown = form[f.key] ?? "";
      if (f.type === "number") v = Number(form[f.key] || 0);
      if (f.type === "status" || f.key === "status") {
        v = form.status || entity.statuses?.[0] || "New";
      }
      row[f.key] = v;
    }
    if (entity.statuses?.length && row.status == null) {
      row.status = entity.statuses[0];
    }
    return row;
  }

  async function saveRecord() {
    const entityId = formEntityId || activeEntityId;
    const entity = entityId ? entityMap[entityId] : undefined;
    if (!entity || !entityId) return;
    if (!validateForm(entity)) return;

    const isEdit = formMode === "edit" && editingId;
    setBusy(isEdit ? `edit-${editingId}` : `create-${entityId}`);
    const res = await mockApiCall({
      endpoint: isEdit ? `PATCH /mock/${entityId}/${editingId}` : `POST /mock/${entityId}`,
      mode: pathMode,
      payload: form,
      failMessage: isEdit
        ? `Update ${entity.name} failed`
        : `Create ${entity.name} failed`,
      successMessage: isEdit ? `${entity.name} updated` : `${entity.name} created`,
      onSuccess: () => {
        if (isEdit && editingId) {
          const next = buildRow(entity, editingId);
          setData((prev) => ({
            ...prev,
            [entityId]: (prev[entityId] || []).map((r) =>
              r.id === editingId ? next : r
            ),
          }));
          return next;
        }
        const row = buildRow(entity, `rec-${Date.now().toString(36)}`);
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
    flash(`${res.message} · ${res.latencyMs}ms`, "success");
    closeForm();
    // Jump to a list/board for this entity if on a form-only screen
    if (activeScreen?.type === "form" || activeScreen?.type === "transfer") {
      const list = visibleScreens.find(
        (s) =>
          (s.entityId === entityId || !s.entityId) &&
          (s.type === "list" || s.type === "board" || s.type === "schedule")
      );
      if (list) setScreenId(list.id);
    }
  }

  async function setStatus(entityId: string, id: string, status: string) {
    if (!role?.canManage && !role?.canCreate) {
      flash("Your role cannot change status - switch to a manager/ops role", "error");
      return;
    }
    setBusy(`st-${id}`);
    const res = await mockApiCall({
      endpoint: `PATCH /mock/${entityId}/${id}/status`,
      mode: pathMode,
      payload: { id, status },
      failMessage: "Status update failed",
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

  async function advanceStatus(entityId: string, row: Row) {
    const entity = entityMap[entityId];
    const statuses = entity?.statuses || [];
    if (!statuses.length) {
      flash("No statuses configured", "info");
      return;
    }
    const cur = String(row.status || statuses[0]);
    const idx = statuses.indexOf(cur);
    const next = statuses[Math.min(idx + 1, statuses.length - 1)];
    if (next === cur) {
      flash(`Already at final status “${cur}”`, "info");
      return;
    }
    await setStatus(entityId, row.id, next);
  }

  async function deleteRecord(entityId: string, id: string) {
    if (!role?.canManage) {
      flash("Only manager roles can delete - switch role", "error");
      return;
    }
    setBusy(`del-${id}`);
    const res = await mockApiCall({
      endpoint: `DELETE /mock/${entityId}/${id}`,
      mode: pathMode,
      payload: { id },
      failMessage: "Delete failed",
      successMessage: "Record deleted",
      onSuccess: () => {
        setData((prev) => ({
          ...prev,
          [entityId]: (prev[entityId] || []).filter((r) => r.id !== id),
        }));
        if (selectedId === id) setSelectedId(null);
        return true;
      },
    });
    setBusy(null);
    flash(
      res.ok ? `${res.message} · ${res.latencyMs}ms` : `${res.error} (${res.latencyMs}ms)`,
      res.ok ? "success" : "error"
    );
  }

  async function duplicateRecord(entityId: string, row: Row) {
    if (!role?.canCreate) {
      flash("Your role cannot create / duplicate", "error");
      return;
    }
    const entity = entityMap[entityId];
    if (!entity) return;
    setBusy(`dup-${row.id}`);
    const res = await mockApiCall({
      endpoint: `POST /mock/${entityId}/duplicate`,
      mode: pathMode,
      payload: row,
      failMessage: "Duplicate failed",
      successMessage: "Duplicated",
      onSuccess: () => {
        const copy: Row = {
          ...row,
          id: `rec-${Date.now().toString(36)}`,
          title: row.title ? `${row.title} (copy)` : row.title,
          name: row.name ? `${row.name} (copy)` : row.name,
          status: entity.statuses?.[0] || row.status,
        };
        setData((prev) => ({
          ...prev,
          [entityId]: [copy, ...(prev[entityId] || [])],
        }));
        return copy;
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

  function filteredRows(entityId: string): Row[] {
    let rows = data[entityId] || [];
    if (statusFilter !== "all") {
      rows = rows.filter((r) => String(r.status) === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }
    return rows;
  }

  function goWorkflow(screenIdTarget: string) {
    const resolved = resolveNavScreenId(screenIdTarget, moduleIds) || screenIdTarget;
    if (moduleIds.has(resolved) || visibleScreens.some((s) => s.id === resolved)) {
      setActivePanel(null);
      setScreenId(
        visibleScreens.some((s) => s.id === resolved)
          ? resolved
          : visibleScreens[0]?.id || resolved
      );
      flash("Opened workflow step", "info");
    } else {
      // Open create on primary as useful default
      openCreate();
    }
  }

  const panel =
    activePanel && shell
      ? panelContent(activePanel, spec.brandName, shell)
      : null;

  function isNavActive(item: StudioNavItem) {
    if (item.panel) return activePanel === item.panel;
    if (activePanel) return false;
    const resolved = resolveNavScreenId(item.screenId || item.id, moduleIds);
    return resolved === activeScreen?.id;
  }

  const showWorkspace =
    !panel &&
    activeScreen &&
    activeScreen.type !== "settings" &&
    activeScreen.type !== "dashboard" &&
    activeEntity;

  const formEntity = formEntityId ? entityMap[formEntityId] : activeEntity;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background text-foreground",
        fullScreen
          ? "h-full max-h-full flex-1"
          : "h-full min-h-[520px] max-h-[calc(100dvh-6rem)] rounded-xl border border-border"
      )}
    >
      <header className="z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: spec.primaryColor || "#0f2744" }}
            >
              {spec.brandName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-base font-bold tracking-tight md:text-lg"
                style={{ color: spec.primaryColor }}
              >
                {spec.brandName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{spec.tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {utilityNav.slice(0, 2).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => activateNav(u)}
                className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted md:inline-flex"
              >
                <NavIcon name={u.icon || "settings"} className="h-3.5 w-3.5" />
                {u.label}
              </button>
            ))}
            {role?.canCreate && (
              <Button type="button" size="sm" variant="cta" onClick={() => openCreate()}>
                <Plus className="h-4 w-4" /> New
              </Button>
            )}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-2 py-1.5">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <select
                value={roleId}
                onChange={(e) => switchRole(e.target.value)}
                disabled={!canSwitchRoles}
                className="max-w-[10rem] bg-transparent text-sm font-semibold outline-none sm:max-w-[14rem] disabled:opacity-60"
                aria-label="Role"
                title={
                  canSwitchRoles
                    ? "App admin: switch any role to test workflows"
                    : "Your account can only use this role"
                }
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

        {!useSidebar && primaryNav.length > 0 && (
          <nav
            className="hidden gap-0.5 overflow-x-auto border-t border-border/60 px-2 py-1 md:flex md:px-4 [scrollbar-width:thin]"
            aria-label="Main"
          >
            {primaryNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateNav(item)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
                  isNavActive(item)
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <NavIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Menu className="h-4 w-4" /> More
            </button>
          </nav>
        )}

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

        {moreOpen && (
          <div className="flex flex-wrap gap-1.5 border-t border-border bg-muted/25 px-3 py-2.5">
            {moreNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateNav(item)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent-teal/40"
              >
                {item.label}
              </button>
            ))}
            {visibleScreens.map((s) => (
              <button
                key={`mod-${s.id}`}
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setActivePanel(null);
                  setScreenId(s.id);
                  flash(`Opened ${s.title}`, "info");
                }}
                className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent-teal/40"
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
          role="status"
        >
          {toast.kind === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {toast.kind === "error" && <XCircle className="h-4 w-4 shrink-0" />}
          {toast.kind === "info" && <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
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
              <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Modules
              </p>
              {visibleScreens.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActivePanel(null);
                    setScreenId(s.id);
                  }}
                  className={cn(
                    "flex w-full rounded-lg px-2.5 py-1.5 text-left text-xs",
                    activeScreen?.id === s.id
                      ? "bg-muted font-semibold"
                      : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <div className="space-y-1 border-t border-border p-3">
              <p className="text-[10px] font-medium text-muted-foreground">Signed in as</p>
              <p className="text-xs font-semibold text-foreground">{role?.label}</p>
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working… {busy}
              </div>
            )}

            {/* ── Modal form (create / edit) - always interactive ── */}
            {formMode && formEntity && (
              <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center">
                <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto p-5 shadow-xl">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {formMode === "edit"
                          ? `Edit ${formEntity.name}`
                          : shell?.ctaLabels?.create || `New ${formEntity.name}`}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Required fields checked. Include the word “fail” to test error UX.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1 hover:bg-muted"
                      onClick={closeForm}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formEntity.fields
                      .filter((f) => f.type !== "status")
                      .map((f) => (
                        <label key={f.key} className="block text-sm">
                          <span className="font-medium">
                            {f.label}
                            {(f.required ||
                              f.key === "title" ||
                              f.key === "name") && (
                              <span className="text-red-500"> *</span>
                            )}
                          </span>
                          {f.type === "textarea" ? (
                            <textarea
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                              rows={3}
                              value={form[f.key] || ""}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, [f.key]: e.target.value }))
                              }
                              placeholder={`Enter ${f.label.toLowerCase()}`}
                            />
                          ) : f.type === "select" ? (
                            <select
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                              value={form[f.key] || f.options?.[0] || ""}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, [f.key]: e.target.value }))
                              }
                            >
                              {(f.options || ["Option A", "Option B"]).map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              type={
                                f.type === "number"
                                  ? "number"
                                  : f.type === "email"
                                    ? "email"
                                    : f.type === "phone"
                                      ? "tel"
                                      : f.type === "date"
                                        ? "date"
                                        : "text"
                              }
                              className="mt-1"
                              value={form[f.key] || ""}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, [f.key]: e.target.value }))
                              }
                              placeholder={`Enter ${f.label.toLowerCase()}`}
                            />
                          )}
                          {formErrors[f.key] && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              {formErrors[f.key]}
                            </p>
                          )}
                        </label>
                      ))}
                    {formEntity.statuses && formEntity.statuses.length > 0 && (
                      <label className="block text-sm">
                        <span className="font-medium">Status</span>
                        <select
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          value={form.status || formEntity.statuses[0]}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, status: e.target.value }))
                          }
                        >
                          {formEntity.statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="cta"
                      disabled={Boolean(busy)}
                      onClick={() => void saveRecord()}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {formMode === "edit" ? "Save changes" : "Create"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={closeForm}>
                      Cancel
                    </Button>
                  </div>
                </Card>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setActivePanel(null);
                      flash("Back to app", "info");
                    }}
                  >
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
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="cta" onClick={() => setActivePanel(null)}>
                    Continue in app
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setActivePanel("support");
                      flash("Support panel opened", "info");
                    }}
                  >
                    Contact support
                  </Button>
                </div>
              </div>
            )}

            {!panel && activeScreen && activeScreen.type !== "dashboard" && (
              <div className="mb-4 space-y-2">
                {activeScreen.imageUrl && (
                  <div className="relative mb-3 h-48 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeScreen.imageUrl}
                      alt={activeScreen.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {activeScreen.title}
                </h1>
                {activeScreen.description && (
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {activeScreen.description}
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
                    onClick={() => goWorkflow(w.screenId)}
                    className="rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1.5 text-xs font-medium text-accent-teal hover:bg-accent-teal/20"
                    title={w.description}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}

            {/* ── Dashboard ── */}
            {!panel && activeScreen?.type === "dashboard" && (
              <div className="space-y-6">
                {activeScreen.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeScreen.imageUrl}
                      alt={activeScreen.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                    {role?.label}
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {spec.learning?.heroHeadline || `Welcome, ${role?.label}`}
                  </h1>
                  <p className="max-w-3xl text-base text-muted-foreground">
                    {spec.learning?.heroSub || spec.description}
                  </p>
                </div>

                {primaryEntity && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {counts(primaryEntity.id).map((c) => (
                      <button
                        key={c.status}
                        type="button"
                        className="text-left"
                        onClick={() => {
                          setStatusFilter(c.status);
                          const list =
                            visibleScreens.find(
                              (s) =>
                                s.entityId === primaryEntity.id &&
                                (s.type === "list" || s.type === "board")
                            ) ||
                            visibleScreens.find(
                              (s) => s.type === "list" || s.type === "board"
                            );
                          if (list) setScreenId(list.id);
                          flash(`Filtered: ${c.status}`, "info");
                        }}
                      >
                        <Card className="p-4 transition hover:border-accent-teal/40">
                          <p className="text-xs uppercase text-muted-foreground">{c.status}</p>
                          <p className="mt-1 text-3xl font-bold text-accent-teal">{c.count}</p>
                          <p className="text-xs text-muted-foreground">
                            {primaryEntity.namePlural} · tap to open
                          </p>
                        </Card>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {workflowsForRole.map((w) => (
                    <Button
                      key={w.id}
                      type="button"
                      variant="cta"
                      onClick={() => goWorkflow(w.screenId)}
                    >
                      {w.name}
                    </Button>
                  ))}
                  {role?.canCreate && (
                    <Button type="button" variant="secondary" onClick={() => openCreate()}>
                      <Plus className="h-4 w-4" /> Quick create
                    </Button>
                  )}
                </div>

                {spec.learning?.howItWorks && spec.learning.howItWorks.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-semibold">How it works</p>
                    <ol className="grid gap-3 md:grid-cols-2">
                      {spec.learning.howItWorks.map((h, i) => (
                        <button
                          key={h.step}
                          type="button"
                          className="text-left"
                          onClick={() => {
                            const target =
                              visibleScreens[Math.min(i + 1, visibleScreens.length - 1)];
                            if (target) {
                              setScreenId(target.id);
                              flash(`Step ${i + 1}: ${h.step}`, "info");
                            }
                          }}
                        >
                          <Card className="flex gap-3 p-4 transition hover:border-accent-teal/40">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white dark:bg-accent-teal dark:text-navy">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">{h.step}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{h.detail}</p>
                              <p className="mt-1 text-[11px] text-accent-teal">Tap to open →</p>
                            </div>
                          </Card>
                        </button>
                      ))}
                    </ol>
                  </div>
                )}

                <Card className="p-4">
                  <p className="text-sm font-medium">Switch role</p>
                  <ul className="mt-2 space-y-2">
                    {spec.roles.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => switchRole(r.id)}
                          className={cn(
                            "flex w-full gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted",
                            r.id === roleId && "bg-accent-teal/10"
                          )}
                        >
                          <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                          <span>
                            <strong className="text-foreground">{r.label}</strong>
                            <span className="text-muted-foreground"> - {r.description}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Live primary list on home so home is never “read-only brochure” */}
                {primaryEntity && (
                  <WorkspaceBlock
                    mode="list"
                    entity={primaryEntity}
                    rows={filteredRows(primaryEntity.id)}
                    canManage={Boolean(role?.canManage || role?.canCreate)}
                    canCreate={Boolean(role?.canCreate)}
                    canDelete={Boolean(role?.canManage)}
                    busy={busy}
                    query={query}
                    statusFilter={statusFilter}
                    selectedId={selectedId}
                    onQuery={setQuery}
                    onStatusFilter={setStatusFilter}
                    onSelect={setSelectedId}
                    onCreate={() => openCreate(primaryEntity.id)}
                    onEdit={(row) => openEdit(primaryEntity.id, row)}
                    onStatus={(id, st) => void setStatus(primaryEntity.id, id, st)}
                    onAdvance={(row) => void advanceStatus(primaryEntity.id, row)}
                    onDelete={(id) => void deleteRecord(primaryEntity.id, id)}
                    onDuplicate={(row) => void duplicateRecord(primaryEntity.id, row)}
                    emptyCopy="Nothing yet - create your first record."
                  />
                )}
              </div>
            )}

            {/* ── List / board / form / any module with data ── */}
            {showWorkspace && activeEntity && activeEntityId && (
              <WorkspaceBlock
                mode={
                  activeScreen?.type === "board"
                    ? "board"
                    : activeScreen?.type === "form" ||
                        activeScreen?.type === "workspace" ||
                        activeScreen?.type === "transfer"
                      ? "form"
                      : "list"
                }
                entity={activeEntity}
                rows={filteredRows(activeEntityId)}
                canManage={Boolean(role?.canManage || role?.canCreate)}
                canCreate={Boolean(role?.canCreate)}
                canDelete={Boolean(role?.canManage)}
                busy={busy}
                query={query}
                statusFilter={statusFilter}
                selectedId={selectedId}
                onQuery={setQuery}
                onStatusFilter={setStatusFilter}
                onSelect={setSelectedId}
                onCreate={() => openCreate(activeEntityId)}
                onEdit={(row) => openEdit(activeEntityId, row)}
                onStatus={(id, st) => void setStatus(activeEntityId, id, st)}
                onAdvance={(row) => void advanceStatus(activeEntityId, row)}
                onDelete={(id) => void deleteRecord(activeEntityId, id)}
                onDuplicate={(row) => void duplicateRecord(activeEntityId, row)}
                emptyCopy={shell?.emptyStates?.list}
                ctaLabel={shell?.ctaLabels?.create}
              />
            )}

            {/* Fallback if no entities at all */}
            {!panel &&
              activeScreen &&
              activeScreen.type !== "settings" &&
              activeScreen.type !== "dashboard" &&
              !activeEntity && (
                <Card className="p-6">
                  <p className="font-medium">No data model on this screen</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open another module from navigation, or switch role.
                  </p>
                  <Button
                    type="button"
                    className="mt-3"
                    variant="cta"
                    onClick={() => {
                      const home = visibleScreens.find((s) => s.type === "dashboard");
                      if (home) setScreenId(home.id);
                    }}
                  >
                    Go to Home
                  </Button>
                </Card>
              )}

            {!panel && activeScreen?.type === "settings" && (
              <div className="mx-auto max-w-2xl space-y-4">
                <Card className="space-y-3 p-6">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <p className="text-sm text-muted-foreground">{spec.description}</p>
                  <label className="mt-2 flex flex-col gap-1 text-sm">
                    <span className="font-medium">Request behaviour (sandbox)</span>
                    <select
                      value={pathMode}
                      onChange={(e) => {
                        setPathMode(e.target.value as MockPathMode);
                        flash(`API path: ${e.target.value}`, "info");
                      }}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="auto">Realistic (auto)</option>
                      <option value="always_ok">Always succeed</option>
                      <option value="always_fail">Always fail</option>
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (primaryEntity) {
                          setData((d) => ({
                            ...d,
                            [primaryEntity.id]: seed(primaryEntity),
                          }));
                          flash("Sample data reset", "success");
                        }
                      }}
                    >
                      Reset sample data
                    </Button>
                    <Button type="button" variant="cta" onClick={() => openCreate()}>
                      <Plus className="h-4 w-4" /> New record
                    </Button>
                  </div>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm font-semibold">Roles - tap to switch</p>
                  {spec.roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => switchRole(r.id)}
                      className={cn(
                        "block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted",
                        r.id === roleId && "bg-accent-teal/10 font-medium"
                      )}
                    >
                      {r.label} - {" "}
                      <span className="font-normal text-muted-foreground">{r.description}</span>
                    </button>
                  ))}
                </Card>
                {spec.learning?.faqs && (
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

            {!panel && workflowsForRole.length > 0 && (
              <Card className="mt-8 border-dashed p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Workflows as {role?.label}
                </p>
                <div className="mt-3 space-y-3">
                  {workflowsForRole.map((w) => (
                    <div key={w.id}>
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-accent-teal hover:underline"
                        onClick={() => goWorkflow(w.screenId)}
                      >
                        {w.name} →
                      </button>
                      <p className="text-xs text-muted-foreground">{w.description}</p>
                      <ol className="mt-1 flex flex-wrap gap-1 text-[11px]">
                        {w.steps.map((s, i) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => goWorkflow(w.screenId)}
                              className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground hover:bg-accent-teal/15 hover:text-accent-teal"
                            >
                              {i + 1}. {s}
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
                                  flash(`Opened ${link.label}`, "info");
                                  return;
                                }
                                if (link.screenId) {
                                  const id = resolveNavScreenId(link.screenId, moduleIds);
                                  if (id && visibleScreens.some((s) => s.id === id)) {
                                    setActivePanel(null);
                                    setScreenId(id);
                                    flash(`Opened ${link.label}`, "info");
                                  } else {
                                    setActivePanel("help");
                                    flash(`${link.label} → Help centre`, "info");
                                  }
                                } else {
                                  setActivePanel("about");
                                  flash(link.label, "info");
                                }
                              }}
                            >
                              {link.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
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
                <div className="mt-4 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                  {shell.footer.disclaimers.map((d) => (
                    <p key={d}>{d}</p>
                  ))}
                  <p className="pt-2 font-medium text-foreground/80">{shell.footer.copyright}</p>
                  <p>{shell.footer.supportLine}</p>
                </div>
              </footer>
            )}
          </div>
        </main>
      </div>

      {shell && primaryNav.length >= 3 && (
        <nav
          className="z-40 flex shrink-0 border-t border-border bg-card/95 backdrop-blur md:hidden"
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
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function WorkspaceBlock({
  mode,
  entity,
  rows,
  canManage,
  canCreate,
  canDelete,
  busy,
  query,
  statusFilter,
  selectedId,
  onQuery,
  onStatusFilter,
  onSelect,
  onCreate,
  onEdit,
  onStatus,
  onAdvance,
  onDelete,
  onDuplicate,
  emptyCopy,
  ctaLabel,
}: {
  mode: "list" | "board" | "form";
  entity: StudioEntity;
  rows: Row[];
  canManage: boolean;
  canCreate: boolean;
  canDelete: boolean;
  busy: string | null;
  query: string;
  statusFilter: string;
  selectedId: string | null;
  onQuery: (q: string) => void;
  onStatusFilter: (s: string) => void;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onEdit: (row: Row) => void;
  onStatus: (id: string, status: string) => void;
  onAdvance: (row: Row) => void;
  onDelete: (id: string) => void;
  onDuplicate: (row: Row) => void;
  emptyCopy?: string;
  ctaLabel?: string;
}) {
  const statuses = entity.statuses || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          {mode === "board" && <LayoutGrid className="h-5 w-5" />}
          {entity.namePlural}
          <Badge className="bg-muted font-normal">{rows.length}</Badge>
        </h2>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <Button type="button" size="sm" variant="cta" onClick={onCreate}>
              <Plus className="h-4 w-4" /> {ctaLabel || `New ${entity.name}`}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Search ${entity.namePlural.toLowerCase()}…`}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
        {statuses.length > 0 && (
          <select
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {mode === "form" && (
        <Card className="border-accent-teal/30 bg-accent-teal/5 p-4">
          <p className="text-sm font-medium">Create or manage {entity.namePlural.toLowerCase()}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use New to open the full form. Existing records below support Edit, Advance, Duplicate,
            and Delete (by role).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canCreate && (
              <Button type="button" variant="cta" onClick={onCreate}>
                <Plus className="h-4 w-4" /> {ctaLabel || `New ${entity.name}`}
              </Button>
            )}
            {!canCreate && (
              <p className="text-sm text-muted-foreground">
                Switch to a role that can create to add records.
              </p>
            )}
          </div>
        </Card>
      )}

      {rows.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyCopy || "No records match. Create one or clear filters."}
          </p>
          {canCreate && (
            <Button type="button" className="mt-3" variant="cta" onClick={onCreate}>
              <Plus className="h-4 w-4" /> Create first {entity.name}
            </Button>
          )}
        </Card>
      )}

      {mode === "board" ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {statuses.map((status) => {
            const col = rows.filter((r) => String(r.status) === status);
            return (
              <div
                key={status}
                className="min-h-[180px] rounded-xl border border-border bg-muted/30 p-3"
              >
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  {status} ({col.length})
                </p>
                <div className="space-y-2">
                  {col.map((r) => (
                    <Card
                      key={r.id}
                      className={cn(
                        "p-3",
                        selectedId === r.id && "ring-2 ring-accent-teal/50"
                      )}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => onSelect(r.id === selectedId ? null : r.id)}
                      >
                        {typeof r.imageUrl === "string" && r.imageUrl && (
                          <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-muted border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.imageUrl as string}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <p className="text-sm font-semibold">{titleOf(r, entity.name)}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {String(r.description || r.notes || r.summary || "")}
                        </p>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {canManage && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-[11px]"
                              onClick={() => onAdvance(r)}
                            >
                              Advance
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-[11px]"
                              onClick={() => onEdit(r)}
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </Button>
                          </>
                        )}
                        {canCreate && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px]"
                            onClick={() => onDuplicate(r)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px] text-red-600"
                            disabled={Boolean(busy)}
                            onClick={() => onDelete(r.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {canManage && statuses.length > 0 && (
                        <select
                          className="mt-2 w-full rounded border border-border bg-background px-1 py-1 text-[11px]"
                          value={String(r.status || status)}
                          disabled={Boolean(busy)}
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
                  {canCreate && (
                    <button
                      type="button"
                      onClick={onCreate}
                      className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-accent-teal/40 hover:text-accent-teal"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card
              key={r.id}
              className={cn(
                "flex flex-wrap items-start justify-between gap-3 p-4",
                selectedId === r.id && "ring-2 ring-accent-teal/40"
              )}
            >
              <div className="flex gap-3 min-w-0 flex-1">
                {typeof r.imageUrl === "string" && r.imageUrl && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.imageUrl as string}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(r.id === selectedId ? null : r.id)}
                >
                  <p className="font-semibold">{titleOf(r, entity.name)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entity.fields
                      .filter((f) => f.key !== "title" && f.key !== "name" && f.key !== "status")
                      .slice(0, 4)
                      .map((f) => `${f.label}: ${String(r[f.key] ?? " - ")}`)
                      .join(" · ")}
                  </p>
                  {selectedId === r.id && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {String(r.description || r.notes || r.summary || r.body || "No long description.")}
                    </p>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-muted">{String(r.status || " - ")}</Badge>
                {canManage && statuses.length > 0 && (
                  <select
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    value={String(r.status || statuses[0])}
                    disabled={Boolean(busy)}
                    onChange={(e) => onStatus(r.id, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onAdvance(r)}
                  disabled={!canManage && !canCreate}
                >
                  Advance
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {canCreate && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => onDuplicate(r)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-red-600"
                    disabled={Boolean(busy)}
                    onClick={() => onDelete(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
