"use client";

/**
 * Real resume product: create/edit resume → live preview → AI improve → mark ready.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { StudioAppSpec, StudioRole } from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

type ResumeRow = {
  id: string;
  title?: string;
  memberName?: string;
  email?: string;
  phone?: string;
  level?: string;
  description?: string;
  experience?: string;
  education?: string;
  skills?: string;
  status?: string;
  [key: string]: unknown;
};

function asResume(row: Record<string, unknown> & { id: string }): ResumeRow {
  return row as ResumeRow;
}

export function ResumeProductApp({
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
  const entity =
    spec.entities.find((e) => /resume/i.test(e.id) || /resume/i.test(e.name)) ||
    spec.entities[0];
  const tipEntity = spec.entities.find((e) => /tip/i.test(e.id));

  const [resumes, setResumes] = useState<ResumeRow[]>(() =>
    (entity?.seed || []).map((r, i) =>
      asResume({ id: `seed-resume-${i}`, status: "Draft", ...r })
    )
  );
  const [activeId, setActiveId] = useState(() => resumes[0]?.id || "");
  const [tab, setTab] = useState<"builder" | "list" | "preview">("builder");
  const [toast, setToast] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  const active = useMemo(
    () => resumes.find((r) => r.id === activeId) || resumes[0],
    [resumes, activeId]
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function updateActive(patch: Partial<ResumeRow>) {
    if (!active) return;
    setResumes((prev) =>
      prev.map((r) => (r.id === active.id ? { ...r, ...patch } : r))
    );
  }

  function createNew() {
    const row: ResumeRow = {
      id: `rec-${Date.now().toString(36)}`,
      title: "Software Engineer",
      memberName: "Your Name",
      email: "you@email.com",
      phone: "+91 90000 00000",
      level: "Early career",
      description:
        "Results-driven professional seeking a role where I can build useful products and grow with a strong team.",
      experience:
        "- Built features used by 10k+ users\n- Collaborated with design and PM on weekly releases\n- Improved page load by 30%",
      education: "B.Tech Computer Science · 2022",
      skills: "JavaScript, TypeScript, React, SQL, Communication",
      status: "Draft",
    };
    setResumes((prev) => [row, ...prev]);
    setActiveId(row.id);
    setTab("builder");
    flash("New resume created — edit left, preview right");
  }

  async function aiImprove(
    action: "improve_summary" | "improve_bullets" | "improve_headline" | "suggest_skills",
    field: keyof ResumeRow
  ) {
    if (!active) return;
    const text = String(active[field] || active.title || "");
    setAiBusy(action);
    try {
      const res = await fetch("/api/app-studio/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: text || String(active.title || "Software Engineer"),
          context: `Target role: ${active.title || ""}. Level: ${active.level || ""}. Product: ${spec.brandName}`,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        flash(data.error || "AI improve failed — check GROQ_API_KEY on server");
        return;
      }
      updateActive({ [field]: data.text } as Partial<ResumeRow>);
      flash("AI improved — check the live preview");
    } catch {
      flash("Network error calling AI");
    } finally {
      setAiBusy(null);
    }
  }

  const isCoach = /coach|admin|recruiter|manager/i.test(role?.id || "") ||
    /coach|admin|recruiter|manager/i.test(role?.label || "");

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullScreen ? "h-full min-h-0" : "h-full min-h-[520px] rounded-xl border border-border overflow-hidden"
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-5">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold" style={{ color: spec.primaryColor }}>
              {spec.brandName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Create → edit → live preview → export
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border-2 border-accent-teal/40 bg-accent-teal/10 px-2.5 py-1.5">
            <UserRound className="h-4 w-4 text-accent-teal" />
            <select
              value={roleId}
              onChange={(e) => onRoleChange(e.target.value)}
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
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 border-t border-border/50 px-3 py-1.5 md:px-5">
          {(
            [
              ["builder", "Build resume"],
              ["preview", "Full preview"],
              ["list", isCoach ? "Review queue" : "My resumes"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium",
                tab === id
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
          <Button type="button" size="sm" variant="cta" className="ml-auto" onClick={createNew}>
            <Plus className="h-4 w-4" /> New resume
          </Button>
        </nav>
      </header>

      {toast && (
        <div className="bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mr-1 inline h-4 w-4" />
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 py-4 md:px-5">
        {tab === "list" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isCoach ? "Resumes to review" : "My resumes"}
            </h2>
            {resumes.map((r) => (
              <Card
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:border-accent-teal/40"
                onClick={() => {
                  setActiveId(r.id);
                  setTab("builder");
                }}
              >
                <div>
                  <p className="font-semibold">{r.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.memberName} · {r.level || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-muted">{String(r.status || "Draft")}</Badge>
                  {isCoach && (
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      value={String(r.status || "Draft")}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setResumes((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, status: e.target.value } : x
                          )
                        );
                        flash(`Status → ${e.target.value}`);
                      }}
                    >
                      {["Draft", "In review", "Ready", "Exported"].map((s) => (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveId(r.id);
                      setTab("preview");
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {(tab === "builder" || tab === "preview") && active && (
          <div
            className={cn(
              "grid gap-4",
              tab === "builder" ? "lg:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"
            )}
          >
            {tab === "builder" && (
              <Card className="space-y-3 p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Edit resume</h2>
                  <Badge className="bg-muted">{String(active.status || "Draft")}</Badge>
                </div>

                <Field label="Target role">
                  <Input
                    value={String(active.title || "")}
                    onChange={(e) => updateActive({ title: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input
                      value={String(active.memberName || "")}
                      onChange={(e) => updateActive({ memberName: e.target.value })}
                    />
                  </Field>
                  <Field label="Level">
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={String(active.level || "Early career")}
                      onChange={(e) => updateActive({ level: e.target.value })}
                    >
                      {["Student", "Early career", "Experienced", "Career switch"].map(
                        (o) => (
                          <option key={o}>{o}</option>
                        )
                      )}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email">
                    <Input
                      value={String(active.email || "")}
                      onChange={(e) => updateActive({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={String(active.phone || "")}
                      onChange={(e) => updateActive({ phone: e.target.value })}
                    />
                  </Field>
                </div>

                <Field
                  label="Professional summary"
                  action={
                    <AiBtn
                      busy={aiBusy === "improve_summary"}
                      onClick={() => void aiImprove("improve_summary", "description")}
                    />
                  }
                >
                  <textarea
                    className="mt-1 min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={String(active.description || "")}
                    onChange={(e) => updateActive({ description: e.target.value })}
                  />
                </Field>

                <Field
                  label="Experience bullets"
                  action={
                    <AiBtn
                      busy={aiBusy === "improve_bullets"}
                      onClick={() => void aiImprove("improve_bullets", "experience")}
                    />
                  }
                >
                  <textarea
                    className="mt-1 min-h-[120px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
                    value={String(active.experience || "")}
                    onChange={(e) => updateActive({ experience: e.target.value })}
                    placeholder={"- Led …\n- Built …"}
                  />
                </Field>

                <Field label="Education">
                  <Input
                    value={String(active.education || "")}
                    onChange={(e) => updateActive({ education: e.target.value })}
                  />
                </Field>

                <Field
                  label="Skills"
                  action={
                    <AiBtn
                      busy={aiBusy === "suggest_skills"}
                      label="Suggest"
                      onClick={() => void aiImprove("suggest_skills", "skills")}
                    />
                  }
                >
                  <Input
                    value={String(active.skills || "")}
                    onChange={(e) => updateActive({ skills: e.target.value })}
                  />
                </Field>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="cta"
                    onClick={() => {
                      updateActive({ status: "In review" });
                      flash("Submitted for review");
                    }}
                  >
                    Submit for review
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      updateActive({ status: "Ready" });
                      flash("Marked Ready");
                    }}
                  >
                    Mark Ready
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      updateActive({ status: "Exported" });
                      flash("Export ready (demo PDF path)");
                      setTab("preview");
                    }}
                  >
                    <Download className="h-4 w-4" /> Export preview
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setTab("preview")}>
                    <Eye className="h-4 w-4" /> Full preview
                  </Button>
                </div>

                {tipEntity && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Tip: use <strong>Improve with AI</strong> on summary and bullets — powered by
                    Groq on the server.
                  </p>
                )}
              </Card>
            )}

            <ResumePreview resume={active} brand={spec.brandName} />
          </div>
        )}

        {!active && (
          <Card className="p-8 text-center">
            <p className="font-medium">No resume yet</p>
            <Button type="button" variant="cta" className="mt-3" onClick={createNew}>
              <Plus className="h-4 w-4" /> Create your first resume
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="flex items-center justify-between gap-2 font-medium">
        {label}
        {action}
      </span>
      {children}
    </label>
  );
}

function AiBtn({
  busy,
  onClick,
  label = "Improve with AI",
}: {
  busy: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-full bg-accent-teal/15 px-2 py-0.5 text-[11px] font-semibold text-accent-teal hover:bg-accent-teal/25 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {label}
    </button>
  );
}

function ResumePreview({ resume, brand }: { resume: ResumeRow; brand: string }) {
  const bullets = String(resume.experience || "")
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <Card className="overflow-hidden border-2 border-border bg-white p-0 text-slate-900 shadow-md dark:bg-slate-950 dark:text-slate-100">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Live preview · {brand}
      </div>
      <div className="space-y-4 px-6 py-6 md:px-8">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight">
            {resume.memberName || "Your Name"}
          </h1>
          <p className="mt-1 text-base font-medium text-teal-700 dark:text-teal-400">
            {resume.title || "Target role"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {[resume.email, resume.phone, resume.level].filter(Boolean).join(" · ")}
          </p>
        </div>

        {resume.description && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Summary
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {String(resume.description)}
            </p>
          </section>
        )}

        {bullets.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Experience
            </h2>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {resume.education && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Education
            </h2>
            <p className="mt-1 text-sm">{String(resume.education)}</p>
          </section>
        )}

        {resume.skills && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skills
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {String(resume.skills)
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {s}
                  </span>
                ))}
            </div>
          </section>
        )}
      </div>
    </Card>
  );
}
