"use client";

/**
 * Fully interactive multi-role app runtime.
 * Role selector top-right; screens & workflows change per role; create/list/board work with local state.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { StudioAppSpec, StudioEntity, StudioScreen } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  Plus,
  Settings,
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
  const defaultRole =
    spec.roles.find((r) => r.isDefault)?.id || spec.roles[0]?.id || "member";
  const [roleId, setRoleId] = useState(defaultRole);
  const role = spec.roles.find((r) => r.id === roleId) || spec.roles[0];

  const visibleScreens = useMemo(() => {
    return spec.screens.filter(
      (s) => !s.roleIds?.length || s.roleIds.includes(roleId)
    );
  }, [spec.screens, roleId]);

  const [screenId, setScreenId] = useState(
    () => visibleScreens[0]?.id || spec.screens[0]?.id || ""
  );

  // Keep screen valid when role changes
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

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function switchRole(id: string) {
    setRoleId(id);
    const nextScreens = spec.screens.filter(
      (s) => !s.roleIds?.length || s.roleIds.includes(id)
    );
    setScreenId(nextScreens[0]?.id || "");
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
    // default status
    if (entity.statuses?.length && row.status == null) {
      row.status = entity.statuses[0];
    }
    setData((prev) => ({
      ...prev,
      [entityId]: [row, ...(prev[entityId] || [])],
    }));
    flash(`${entity.name} created`);
    setForm({});
    // jump to list/board for that entity
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

  const primaryEntity = spec.entities[0];

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullScreen ? "h-full min-h-0" : "h-full min-h-[480px] rounded-xl border border-border overflow-hidden",
        className
      )}
    >
      {/* Brand + ROLE SELECTOR always top-right */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-5">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight" style={{ color: spec.primaryColor }}>
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
              <label className="sr-only" htmlFor="role-select">
                Role
              </label>
              <select
                id="role-select"
                value={roleId}
                onChange={(e) => switchRole(e.target.value)}
                className="max-w-[11rem] bg-transparent text-sm font-bold text-foreground outline-none md:max-w-[14rem]"
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

        {role && (
          <div className="border-t border-border/60 bg-accent-teal/5 px-3 py-1.5 text-xs text-muted-foreground md:px-5">
            <span className="font-semibold text-accent-teal">Viewing as {role.label}</span>
            {" — "}
            {role.description}
            {workflowsForRole[0] && (
              <span className="hidden sm:inline">
                {" "}
                · Start: <strong>{workflowsForRole[0].name}</strong>
              </span>
            )}
          </div>
        )}
      </header>

      {toast && (
        <div className="bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 py-5 md:px-5">
        {/* Workflow chips for this role */}
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

        {!activeScreen && (
          <p className="text-muted-foreground">No screens for this role.</p>
        )}

        {activeScreen?.type === "dashboard" && (
          <DashboardView
            spec={spec}
            roleLabel={role?.label || ""}
            entity={primaryEntity}
            counts={primaryEntity ? countsFor(primaryEntity.id) : []}
            workflows={workflowsForRole}
            onOpen={(id) => setScreenId(id)}
            screens={visibleScreens}
          />
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
              else {
                const anyForm = visibleScreens.find((s) => s.type === "form");
                if (anyForm) setScreenId(anyForm.id);
              }
            }}
          />
        )}

        {activeScreen?.type === "schedule" && activeScreen.entityId && (
          <ScheduleView
            entity={entityMap[activeScreen.entityId]}
            rows={data[activeScreen.entityId] || []}
            canBook={Boolean(role?.canCreate)}
            onBook={(row) => {
              const bookingEntity = spec.entities.find((e) => e.id === "booking") ||
                spec.entities.find((e) => /book/i.test(e.id));
              if (bookingEntity) {
                addRecord(bookingEntity.id, {
                  memberName: role?.label || "You",
                  classTitle: String(row.title || row.name || "Item"),
                  plan: "Drop-in",
                  status: bookingEntity.statuses?.[0] || "Confirmed",
                });
              } else {
                flash("Booked (local)");
              }
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

        {activeScreen?.type === "settings" && (
          <Card className="max-w-lg space-y-3 p-6">
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">
              {spec.description}
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Roles in this app:</strong>
              </p>
              <ul className="list-inside list-disc text-muted-foreground">
                {spec.roles.map((r) => (
                  <li key={r.id}>
                    {r.label} — {r.description}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Switch roles with the selector (top right) to try every workflow.
            </p>
          </Card>
        )}

        {activeScreen?.type === "detail" && (
          <Card className="p-6">
            <h2 className="font-semibold">{activeScreen.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeScreen.description || "Detail view"}
            </p>
          </Card>
        )}

        {/* Workflow detail card */}
        {workflowsForRole.length > 0 && activeScreen && (
          <Card className="mt-8 border-dashed p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your workflows as {role?.label}
            </p>
            <div className="mt-3 space-y-3">
              {workflowsForRole.map((w) => (
                <div key={w.id}>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                  <ol className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    {w.steps.map((s, i) => (
                      <li
                        key={s}
                        className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                      >
                        {i + 1}. {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <footer className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">
        {spec.brandName} · Interactive demo · Role: {role?.label}
      </footer>
    </div>
  );
}

function DashboardView({
  spec,
  roleLabel,
  entity,
  counts,
  workflows,
  onOpen,
  screens,
}: {
  spec: StudioAppSpec;
  roleLabel: string;
  entity?: StudioEntity;
  counts: Array<{ status: string; count: number }>;
  workflows: StudioWorkflowLike[];
  onOpen: (screenId: string) => void;
  screens: StudioScreen[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome, {roleLabel}
        </h1>
        <p className="mt-1 text-muted-foreground">{spec.description}</p>
        <p className="mt-2 text-xs text-accent-teal">
          Switch roles with the selector (top right) to see other user workflows.
        </p>
      </div>
      {counts.length > 0 && entity && (
        <div className="grid gap-3 sm:grid-cols-3">
          {counts.map((c) => (
            <Card key={c.status} className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{c.status}</p>
              <p className="mt-1 text-3xl font-bold text-accent-teal">{c.count}</p>
              <p className="text-xs text-muted-foreground">{entity.namePlural}</p>
            </Card>
          ))}
        </div>
      )}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your workflows
        </p>
        <div className="flex flex-wrap gap-2">
          {workflows.map((w) => (
            <Button key={w.id} type="button" variant="cta" onClick={() => onOpen(w.screenId)}>
              {w.name}
            </Button>
          ))}
          {workflows.length === 0 &&
            screens
              .filter((s) => s.type !== "dashboard" && s.type !== "settings")
              .slice(0, 4)
              .map((s) => (
                <Button key={s.id} type="button" variant="secondary" onClick={() => onOpen(s.id)}>
                  {s.title}
                </Button>
              ))}
        </div>
      </div>
      <Card className="border-dashed p-4">
        <p className="text-sm font-medium">Roles in this app</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {spec.roles.map((r) => (
            <li key={r.id}>
              <strong className="text-foreground">{r.label}</strong> — {r.description}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

type StudioWorkflowLike = { id: string; name: string; screenId: string };

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
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No records yet. Use the form to create one.</p>
      )}
      {rows.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{String(r.title || r.name || r.memberName || r.classTitle || entity.name)}</p>
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

function ScheduleView({
  entity,
  rows,
  canBook,
  onBook,
}: {
  entity?: StudioEntity;
  rows: RecordRow[];
  canBook: boolean;
  onBook: (row: RecordRow) => void;
}) {
  if (!entity) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{entity.namePlural} schedule</h2>
      {rows.map((r) => (
        <Card
          key={r.id}
          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="text-lg font-semibold">{String(r.title)}</p>
            <p className="text-sm text-muted-foreground">
              {String(r.when || "")}
              {r.instructor ? ` · ${String(r.instructor)}` : ""}
              {r.level ? ` · ${String(r.level)}` : ""}
            </p>
            {r.spots != null && (
              <p className="mt-1 text-xs text-accent-teal">{String(r.spots)} spots left</p>
            )}
          </div>
          {canBook && (
            <Button type="button" variant="cta" onClick={() => onBook(r)}>
              <Plus className="h-4 w-4" /> Book
            </Button>
          )}
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
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {status} ({rows.filter((r) => String(r.status) === status).length})
            </p>
            <div className="space-y-2">
              {rows
                .filter((r) => String(r.status) === status)
                .map((r) => (
                  <Card key={r.id} className="p-3 shadow-sm">
                    <p className="text-sm font-semibold">
                      {String(r.title || r.memberName || r.classTitle || entity.name)}
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
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            ) : f.type === "select" ? (
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={form[f.key] || f.options?.[0] || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
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
