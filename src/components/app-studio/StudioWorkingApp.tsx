"use client";

/**
 * Interactive multi-role app runtime.
 * Domain products (resume, banking) get real UIs; others use generic workflows.
 */

import { BankingProductApp } from "@/components/app-studio/products/BankingProductApp";
import { ResumeProductApp } from "@/components/app-studio/products/ResumeProductApp";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { detectProductKind } from "@/lib/app-studio/product-kind";
import type { StudioAppSpec, StudioEntity, StudioScreen } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  Plus,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

type RecordRow = Record<string, unknown> & { id: string };

function seedRecords(entity: StudioEntity): RecordRow[] {
  return (entity.seed || []).map((row, i) => ({
    id: `seed-${entity.id}-${i}`,
    ...row,
  }));
}

export function StudioWorkingApp({
  spec,
  fullScreen = false,
  className,
}: {
  spec: StudioAppSpec;
  fullScreen?: boolean;
  className?: string;
}) {
  const productKind = detectProductKind(spec);
  const defaultRole =
    spec.roles.find((r) => r.isDefault)?.id || spec.roles[0]?.id || "member";
  const [roleId, setRoleId] = useState(defaultRole);
  const role = spec.roles.find((r) => r.id === roleId) || spec.roles[0];

  // Specialized product experiences (not generic dashboards)
  if (productKind === "resume") {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <ResumeProductApp
          spec={spec}
          role={role}
          roleId={roleId}
          onRoleChange={setRoleId}
          fullScreen={fullScreen}
        />
      </div>
    );
  }
  if (productKind === "banking") {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <BankingProductApp
          spec={spec}
          role={role}
          roleId={roleId}
          onRoleChange={setRoleId}
          fullScreen={fullScreen}
        />
      </div>
    );
  }

  return (
    <GenericProductApp
      spec={spec}
      fullScreen={fullScreen}
      className={className}
      roleId={roleId}
      setRoleId={setRoleId}
      role={role}
    />
  );
}

function GenericProductApp({
  spec,
  fullScreen,
  className,
  roleId,
  setRoleId,
  role,
}: {
  spec: StudioAppSpec;
  fullScreen?: boolean;
  className?: string;
  roleId: string;
  setRoleId: (id: string) => void;
  role?: StudioAppSpec["roles"][0];
}) {
  const visibleScreens = useMemo(() => {
    return spec.screens.filter(
      (s) => !s.roleIds?.length || s.roleIds.includes(roleId)
    );
  }, [spec.screens, roleId]);

  const [screenId, setScreenId] = useState(
    () =>
      visibleScreens.find((s) => s.type !== "dashboard")?.id ||
      visibleScreens[0]?.id ||
      spec.screens[0]?.id ||
      ""
  );

  const activeScreen: StudioScreen | undefined =
    visibleScreens.find((s) => s.id === screenId) || visibleScreens[0];

  const [data, setData] = useState<Record<string, RecordRow[]>>(() => {
    const init: Record<string, RecordRow[]> = {};
    for (const e of spec.entities) {
      init[e.id] = seedRecords(e);
    }
    return init;
  });

  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const workflowsForRole = spec.workflows.filter((w) => w.roleId === roleId);
  const entityMap = Object.fromEntries(spec.entities.map((e) => [e.id, e]));
  const primaryEntity = spec.entities[0];

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function switchRole(id: string) {
    setRoleId(id);
    const nextScreens = spec.screens.filter(
      (s) => !s.roleIds?.length || s.roleIds.includes(id)
    );
    setScreenId(
      nextScreens.find((s) => s.type !== "dashboard")?.id || nextScreens[0]?.id || ""
    );
    setForm({});
  }

  function addRecord(entityId: string, values: Record<string, string>) {
    const entity = entityMap[entityId];
    if (!entity) return;
    const row: RecordRow = {
      id: `rec-${Date.now().toString(36)}`,
      ...Object.fromEntries(
        entity.fields.map((f) => {
          let v: unknown = values[f.key] ?? "";
          if (f.type === "number") v = Number(values[f.key] || 0);
          if (f.type === "status" && !values[f.key]) {
            v = entity.statuses?.[0] || "New";
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
    flash(`${entity.name} created`);
    setForm({});
    const listScreen = visibleScreens.find(
      (s) =>
        s.entityId === entityId &&
        (s.type === "list" || s.type === "board" || s.type === "schedule")
    );
    if (listScreen) setScreenId(listScreen.id);
  }

  function setStatus(entityId: string, recordId: string, status: string) {
    setData((prev) => ({
      ...prev,
      [entityId]: (prev[entityId] || []).map((r) =>
        r.id === recordId ? { ...r, status } : r
      ),
    }));
    flash(`Status → ${status}`);
  }

  function countsFor(entityId: string) {
    const entity = entityMap[entityId];
    const rows = data[entityId] || [];
    const statuses = entity?.statuses || [];
    return statuses.map((s) => ({
      status: s,
      count: rows.filter((r) => String(r.status) === s).length,
    }));
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullScreen
          ? "h-full min-h-0"
          : "h-full min-h-[480px] rounded-xl border border-border overflow-hidden",
        className
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-5">
          <div className="min-w-0">
            <p
              className="truncate text-lg font-bold tracking-tight"
              style={{ color: spec.primaryColor }}
            >
              {spec.brandName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{spec.tagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Try as
            </span>
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-accent-teal/40 bg-accent-teal/10 px-2.5 py-1.5 shadow-sm">
              <UserRound className="h-4 w-4 text-accent-teal" />
              <select
                value={roleId}
                onChange={(e) => switchRole(e.target.value)}
                className="max-w-[11rem] bg-transparent text-sm font-bold outline-none md:max-w-[14rem]"
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
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 border-t border-border/50 px-3 py-1.5 md:px-5">
          {visibleScreens.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScreenId(s.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                activeScreen?.id === s.id
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </header>

      {toast && (
        <div className="bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 py-5 md:px-5">
        {workflowsForRole.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {workflowsForRole.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setScreenId(w.screenId)}
                className="inline-flex items-center gap-1 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1 text-xs font-medium text-accent-teal hover:bg-accent-teal/20"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {w.name}
                <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {activeScreen?.type === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {role?.label}</h1>
              <p className="mt-1 text-muted-foreground">{spec.description}</p>
            </div>
            {primaryEntity && (
              <div className="grid gap-3 sm:grid-cols-3">
                {countsFor(primaryEntity.id).map((c) => (
                  <Card key={c.status} className="p-4">
                    <p className="text-xs uppercase text-muted-foreground">{c.status}</p>
                    <p className="mt-1 text-3xl font-bold text-accent-teal">{c.count}</p>
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
          </div>
        )}

        {activeScreen?.type === "list" && activeScreen.entityId && (
          <ListView
            entity={entityMap[activeScreen.entityId]}
            rows={data[activeScreen.entityId] || []}
            canManage={Boolean(role?.canManage)}
            canCreate={Boolean(role?.canCreate)}
            onStatus={(id, st) => setStatus(activeScreen.entityId!, id, st)}
            onCreate={() => {
              const formScreen = visibleScreens.find(
                (s) => s.type === "form" && s.entityId === activeScreen.entityId
              );
              if (formScreen) setScreenId(formScreen.id);
            }}
          />
        )}

        {activeScreen?.type === "board" && activeScreen.entityId && (
          <BoardView
            entity={entityMap[activeScreen.entityId]}
            rows={data[activeScreen.entityId] || []}
            canManage={Boolean(role?.canManage || role?.canCreate)}
            onStatus={(id, st) => setStatus(activeScreen.entityId!, id, st)}
          />
        )}

        {activeScreen?.type === "form" && activeScreen.entityId && (
          <FormView
            entity={entityMap[activeScreen.entityId]}
            form={form}
            setForm={setForm}
            canCreate={Boolean(role?.canCreate)}
            onSubmit={() => addRecord(activeScreen.entityId!, form)}
          />
        )}

        {activeScreen?.type === "schedule" && activeScreen.entityId && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">
              {entityMap[activeScreen.entityId]?.namePlural} schedule
            </h2>
            {(data[activeScreen.entityId] || []).map((r) => (
              <Card
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-semibold">{String(r.title)}</p>
                  <p className="text-sm text-muted-foreground">
                    {String(r.when || "")}
                    {r.instructor ? ` · ${String(r.instructor)}` : ""}
                  </p>
                </div>
                {role?.canCreate && (
                  <Button
                    type="button"
                    variant="cta"
                    onClick={() => {
                      const booking =
                        spec.entities.find((e) => /book/i.test(e.id)) ||
                        spec.entities[1];
                      if (booking) {
                        addRecord(booking.id, {
                          memberName: role?.label || "You",
                          classTitle: String(r.title || ""),
                          plan: "Drop-in",
                          status: booking.statuses?.[0] || "Confirmed",
                        });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" /> Book
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {activeScreen?.type === "settings" && (
          <Card className="max-w-lg space-y-3 p-6">
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">{spec.description}</p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {spec.roles.map((r) => (
                <li key={r.id}>
                  {r.label} — {r.description}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}

function ListView({
  entity,
  rows,
  canManage,
  canCreate,
  onStatus,
  onCreate,
}: {
  entity?: StudioEntity;
  rows: RecordRow[];
  canManage: boolean;
  canCreate?: boolean;
  onStatus: (id: string, status: string) => void;
  onCreate?: () => void;
}) {
  if (!entity) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{entity.namePlural}</h2>
        {canCreate && onCreate && (
          <Button type="button" size="sm" variant="cta" onClick={onCreate}>
            <Plus className="h-4 w-4" /> New {entity.name}
          </Button>
        )}
      </div>
      {rows.map((r) => (
        <Card
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div>
            <p className="font-semibold">
              {String(r.title || r.name || r.memberName || entity.name)}
            </p>
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

function BoardView({
  entity,
  rows,
  canManage,
  onStatus,
}: {
  entity?: StudioEntity;
  rows: RecordRow[];
  canManage: boolean;
  onStatus: (id: string, status: string) => void;
}) {
  if (!entity) return null;
  const statuses = entity.statuses || ["New", "Done"];
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <LayoutGrid className="h-5 w-5" /> {entity.namePlural} board
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {statuses.map((status) => (
          <div
            key={status}
            className="min-h-[200px] rounded-xl border border-border bg-muted/30 p-3"
          >
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
              {status} ({rows.filter((r) => String(r.status) === status).length})
            </p>
            <div className="space-y-2">
              {rows
                .filter((r) => String(r.status) === status)
                .map((r) => (
                  <Card key={r.id} className="p-3 shadow-sm">
                    <p className="text-sm font-semibold">
                      {String(r.title || r.memberName || entity.name)}
                    </p>
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

function FormView({
  entity,
  form,
  setForm,
  canCreate,
  onSubmit,
}: {
  entity?: StudioEntity;
  form: Record<string, string>;
  setForm: Dispatch<SetStateAction<Record<string, string>>>;
  canCreate: boolean;
  onSubmit: () => void;
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
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ListTodo className="h-5 w-5" /> New {entity.name}
      </h2>
      {entity.fields
        .filter((f) => f.type !== "status")
        .map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form[f.key] || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            ) : f.type === "select" ? (
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form[f.key] || f.options?.[0] || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              >
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={f.type === "number" ? "number" : "text"}
                className="mt-1"
                value={form[f.key] || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
      <Button type="button" variant="cta" onClick={onSubmit}>
        <Plus className="h-4 w-4" /> Create {entity.name}
      </Button>
    </Card>
  );
}
