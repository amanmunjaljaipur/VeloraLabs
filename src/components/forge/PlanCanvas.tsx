"use client";

import { Button } from "@/components/ui/Button";
import type { ForgeBuildPlan, ForgeDataModel, ForgeFeature, ForgeRole, ForgeScreen } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Database,
  Layout,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type SectionKey =
  | "productSummary"
  | "roles"
  | "dataModels"
  | "features"
  | "screens"
  | "techStack"
  | "integrations"
  | "assumptions";

const SECTION_META: Array<{
  key: SectionKey;
  title: string;
  icon: ReactNode;
}> = [
  { key: "productSummary", title: "Product summary", icon: <Sparkles className="h-4 w-4" /> },
  { key: "roles", title: "User roles", icon: <Shield className="h-4 w-4" /> },
  { key: "dataModels", title: "Data models", icon: <Database className="h-4 w-4" /> },
  { key: "features", title: "Features / modules", icon: <Workflow className="h-4 w-4" /> },
  { key: "screens", title: "Screens / pages", icon: <Layout className="h-4 w-4" /> },
  { key: "techStack", title: "Tech stack", icon: <Boxes className="h-4 w-4" /> },
  { key: "integrations", title: "Integrations", icon: <Boxes className="h-4 w-4" /> },
  { key: "assumptions", title: "Assumptions", icon: <Pencil className="h-4 w-4" /> },
];

export function PlanCanvas({
  plan,
  highlightSections,
  regeneratingSection,
  onChange,
  onRegenerateSection,
  empty,
}: {
  plan: ForgeBuildPlan | null;
  highlightSections?: string[];
  regeneratingSection?: string | null;
  onChange: (plan: ForgeBuildPlan) => void;
  onRegenerateSection: (section: SectionKey) => void;
  empty?: boolean;
}) {
  if (empty || !plan) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <Layout className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Plan Canvas</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          After discovery, your editable build plan appears here — roles, data models,
          screens, and more.
        </p>
      </div>
    );
  }

  const hi = new Set(highlightSections || []);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <header className="sticky top-0 z-10 -mx-1 rounded-xl border border-border/80 bg-card/95 px-4 py-3 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-teal">
          {plan.archetype.replace(/_/g, " ")} · {plan.domain}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{plan.brandName}</h2>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
      </header>

      {SECTION_META.map((sec) => (
        <section
          key={sec.key}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-xs transition",
            hi.has(sec.key)
              ? "border-accent-teal ring-2 ring-accent-teal/30"
              : "border-border"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {sec.icon}
              {sec.title}
            </h3>
            <button
              type="button"
              onClick={() => onRegenerateSection(sec.key)}
              disabled={regeneratingSection === sec.key}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Regenerate this section"
            >
              {regeneratingSection === sec.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regen
            </button>
          </div>

          {sec.key === "productSummary" && (
            <textarea
              value={plan.productSummary}
              onChange={(e) =>
                onChange({ ...plan, productSummary: e.target.value })
              }
              rows={4}
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-teal"
            />
          )}

          {sec.key === "roles" && (
            <RolesEditor
              roles={plan.roles}
              onChange={(roles) => onChange({ ...plan, roles })}
            />
          )}

          {sec.key === "dataModels" && (
            <ModelsEditor
              models={plan.dataModels}
              onChange={(dataModels) => onChange({ ...plan, dataModels })}
            />
          )}

          {sec.key === "features" && (
            <FeaturesEditor
              features={plan.features}
              onChange={(features) => onChange({ ...plan, features })}
            />
          )}

          {sec.key === "screens" && (
            <ScreensEditor
              screens={plan.screens}
              onChange={(screens) => onChange({ ...plan, screens })}
            />
          )}

          {sec.key === "techStack" && (
            <div className="space-y-2 text-sm">
              {(
                [
                  ["frontend", "Frontend"],
                  ["backend", "Backend"],
                  ["database", "Database"],
                  ["auth", "Auth"],
                  ["hosting", "Hosting"],
                  ["justification", "Why this stack"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <input
                    value={plan.techStack[k]}
                    onChange={(e) =>
                      onChange({
                        ...plan,
                        techStack: { ...plan.techStack, [k]: e.target.value },
                      })
                    }
                    className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent-teal"
                  />
                </label>
              ))}
            </div>
          )}

          {sec.key === "integrations" && (
            <ul className="space-y-2">
              {plan.integrations.map((ing, i) => (
                <li
                  key={ing.id || i}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border/80 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <input
                      value={ing.name}
                      onChange={(e) => {
                        const integrations = [...plan.integrations];
                        integrations[i] = { ...ing, name: e.target.value };
                        onChange({ ...plan, integrations });
                      }}
                      className="w-full bg-transparent text-sm font-medium outline-none"
                    />
                    <input
                      value={ing.purpose}
                      onChange={(e) => {
                        const integrations = [...plan.integrations];
                        integrations[i] = { ...ing, purpose: e.target.value };
                        onChange({ ...plan, integrations });
                      }}
                      className="mt-0.5 w-full bg-transparent text-xs text-muted-foreground outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...plan,
                        integrations: plan.integrations.filter((_, j) => j !== i),
                      })
                    }
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onChange({
                    ...plan,
                    integrations: [
                      ...plan.integrations,
                      {
                        id: `int_${Date.now().toString(36)}`,
                        name: "New integration",
                        purpose: "Describe purpose",
                        required: false,
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </ul>
          )}

          {sec.key === "assumptions" && (
            <ul className="space-y-2">
              {plan.assumptions.map((a, i) => (
                <li
                  key={a.id || i}
                  className={cn(
                    "flex items-start gap-2 rounded-xl px-3 py-2 text-sm",
                    a.fromDefault
                      ? "border border-amber-500/30 bg-amber-500/5"
                      : "border border-border bg-muted/20"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    {a.fromDefault && (
                      <span className="mr-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                        Default
                      </span>
                    )}
                    <input
                      value={a.text}
                      onChange={(e) => {
                        const assumptions = [...plan.assumptions];
                        assumptions[i] = { ...a, text: e.target.value };
                        onChange({ ...plan, assumptions });
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...plan,
                        assumptions: plan.assumptions.filter((_, j) => j !== i),
                      })
                    }
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function RolesEditor({
  roles,
  onChange,
}: {
  roles: ForgeRole[];
  onChange: (r: ForgeRole[]) => void;
}) {
  return (
    <div className="space-y-2">
      {roles.map((role, i) => (
        <div
          key={role.id || i}
          className="rounded-xl border border-border/80 bg-muted/15 p-3"
        >
          <div className="flex items-start gap-2">
            <input
              value={role.name}
              onChange={(e) => {
                const next = [...roles];
                next[i] = { ...role, name: e.target.value };
                onChange(next);
              }}
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(roles.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            value={role.description}
            onChange={(e) => {
              const next = [...roles];
              next[i] = { ...role, description: e.target.value };
              onChange(next);
            }}
            className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
          />
          <input
            value={role.permissions.join(", ")}
            onChange={(e) => {
              const next = [...roles];
              next[i] = {
                ...role,
                permissions: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              };
              onChange(next);
            }}
            className="mt-2 w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-xs outline-none"
            placeholder="Permissions, comma-separated"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange([
            ...roles,
            {
              id: `role_${Date.now().toString(36)}`,
              name: "New role",
              description: "What they can do",
              permissions: ["view"],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Add role
      </Button>
    </div>
  );
}

function ModelsEditor({
  models,
  onChange,
}: {
  models: ForgeDataModel[];
  onChange: (m: ForgeDataModel[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(models[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {models.map((model, i) => (
        <div
          key={model.id || i}
          className="rounded-xl border border-border/80 bg-muted/15"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left"
            onClick={() => setOpenId(openId === model.id ? null : model.id)}
          >
            <span className="text-sm font-semibold">{model.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {model.fields.length} fields
            </span>
          </button>
          {openId === model.id && (
            <div className="space-y-2 border-t border-border/60 px-3 py-2">
              <input
                value={model.name}
                onChange={(e) => {
                  const next = [...models];
                  next[i] = { ...model, name: e.target.value };
                  onChange(next);
                }}
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
              />
              {model.fields.map((field, fi) => (
                <div key={fi} className="flex flex-wrap items-center gap-1">
                  <input
                    value={field.name}
                    onChange={(e) => {
                      const next = [...models];
                      const fields = [...model.fields];
                      fields[fi] = { ...field, name: e.target.value };
                      next[i] = { ...model, fields };
                      onChange(next);
                    }}
                    className="min-w-[6rem] flex-1 rounded border border-border bg-background px-1.5 py-1 text-xs"
                    placeholder="field"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const next = [...models];
                      const fields = [...model.fields];
                      fields[fi] = { ...field, type: e.target.value };
                      next[i] = { ...model, fields };
                      onChange(next);
                    }}
                    className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                  >
                    {[
                      "string",
                      "text",
                      "number",
                      "boolean",
                      "date",
                      "datetime",
                      "enum",
                      "money",
                      "email",
                      "phone",
                      "url",
                      "image",
                      "file",
                      "relation",
                      "json",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...models];
                      next[i] = {
                        ...model,
                        fields: model.fields.filter((_, j) => j !== fi),
                      };
                      onChange(next);
                    }}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const next = [...models];
                    next[i] = {
                      ...model,
                      fields: [
                        ...model.fields,
                        { name: "newField", type: "string" },
                      ],
                    };
                    onChange(next);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Field
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onChange(models.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Model
                </Button>
              </div>
              {model.relationships?.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {model.relationships.join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange([
            ...models,
            {
              id: `model_${Date.now().toString(36)}`,
              name: "New entity",
              fields: [{ name: "id", type: "string", required: true }],
              relationships: [],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Add model
      </Button>
    </div>
  );
}

function FeaturesEditor({
  features,
  onChange,
}: {
  features: ForgeFeature[];
  onChange: (f: ForgeFeature[]) => void;
}) {
  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div
          key={f.id || i}
          className="rounded-xl border border-border/80 bg-muted/15 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              value={f.title}
              onChange={(e) => {
                const next = [...features];
                next[i] = { ...f, title: e.target.value };
                onChange(next);
              }}
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
            />
            <select
              value={f.priority}
              onChange={(e) => {
                const next = [...features];
                next[i] = {
                  ...f,
                  priority: e.target.value as ForgeFeature["priority"],
                };
                onChange(next);
              }}
              className="rounded border border-border bg-background px-1 py-0.5 text-[10px] uppercase"
            >
              <option value="must">must</option>
              <option value="should">should</option>
              <option value="could">could</option>
            </select>
            <button
              type="button"
              onClick={() => onChange(features.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            value={f.description}
            onChange={(e) => {
              const next = [...features];
              next[i] = { ...f, description: e.target.value };
              onChange(next);
            }}
            className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange([
            ...features,
            {
              id: `f_${Date.now().toString(36)}`,
              title: "New feature",
              description: "What it does",
              priority: "should",
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Add feature
      </Button>
    </div>
  );
}

function ScreensEditor({
  screens,
  onChange,
}: {
  screens: ForgeScreen[];
  onChange: (s: ForgeScreen[]) => void;
}) {
  return (
    <div className="space-y-2">
      {screens.map((s, i) => (
        <div
          key={s.id || i}
          className="rounded-xl border border-border/80 bg-muted/15 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              value={s.title}
              onChange={(e) => {
                const next = [...screens];
                next[i] = { ...s, title: e.target.value };
                onChange(next);
              }}
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
            />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                s.zone === "public"
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  : "bg-violet-500/15 text-violet-700 dark:text-violet-300"
              )}
            >
              {s.zone}
            </span>
            <button
              type="button"
              onClick={() => onChange(screens.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            value={s.purpose}
            onChange={(e) => {
              const next = [...screens];
              next[i] = { ...s, purpose: e.target.value };
              onChange(next);
            }}
            className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            /{s.path}
            {s.sections?.length ? ` · ${s.sections.join(", ")}` : ""}
          </p>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange([
            ...screens,
            {
              id: `scr_${Date.now().toString(36)}`,
              path: "new-page",
              title: "New page",
              purpose: "Describe purpose",
              zone: "public",
              sections: ["Hero", "Content"],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Add screen
      </Button>
    </div>
  );
}
