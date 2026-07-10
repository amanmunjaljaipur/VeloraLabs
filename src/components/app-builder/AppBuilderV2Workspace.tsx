"use client";

/**
 * App Builder V2 — one prompt in, deep research (incl. a competitor scan) and
 * a real, working product out. Reuses Forge's plan engine (buildForgePlan
 * with no discovery Q&A) and PlanCanvas for editing, but skips the
 * multi-question interview entirely, and the resulting product renders with
 * Verlin Labs' own UI components (VerlinAppRuntime) instead of a per-app
 * generated theme.
 */

import { PlanCanvas } from "@/components/forge/PlanCanvas";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { FORGE_EXAMPLE_PROMPTS } from "@/lib/forge/archetypes";
import { validateForgePlan } from "@/lib/forge/plan-edit";
import type { ForgeBuildPlan } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ExternalLink,
  History,
  Loader2,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "app-builder-v2-draft-v1";

type V2Stage = "intake" | "plan" | "build" | "preview";

const STAGE_ORDER: Array<{ id: V2Stage; label: string }> = [
  { id: "intake", label: "Prompt" },
  { id: "plan", label: "Plan & research" },
  { id: "build", label: "Build" },
  { id: "preview", label: "Live" },
];

type PersistedDraft = {
  stage: V2Stage;
  prompt: string;
  plan: ForgeBuildPlan | null;
  planVersion: number;
  planHistory: Array<{ version: number; at: string; note: string }>;
  publicUrl?: string;
  appSlug?: string;
};

function loadDraft(): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDraft;
  } catch {
    return null;
  }
}

function saveDraft(d: PersistedDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore quota
  }
}

function V2StageIndicator({ stage, onJump }: { stage: V2Stage; onJump?: (s: V2Stage) => void }) {
  const current = STAGE_ORDER.findIndex((s) => s.id === stage);
  return (
    <nav aria-label="App Builder V2 stages" className="flex flex-wrap items-center gap-1 sm:gap-2">
      {STAGE_ORDER.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = Boolean(onJump) && (done || active);
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <span
                className={cn(
                  "hidden h-px w-4 sm:block sm:w-6",
                  i <= current ? "bg-accent-teal" : "bg-border"
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(s.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                active && "bg-navy text-white shadow-sm dark:bg-accent-teal dark:text-navy",
                done && !active && "bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25",
                !done && !active && "bg-muted/60 text-muted-foreground",
                clickable && !active && "cursor-pointer",
                !clickable && "cursor-default opacity-70"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  active && "bg-white/20",
                  done && !active && "bg-accent-teal text-white",
                  !done && !active && "bg-border text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export function AppBuilderV2Workspace() {
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<V2Stage>("intake");
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<ForgeBuildPlan | null>(null);
  const [planVersion, setPlanVersion] = useState(0);
  const [planHistory, setPlanHistory] = useState<Array<{ version: number; at: string; note: string }>>([]);
  const [highlightSections, setHighlightSections] = useState<string[]>([]);
  const [nlEdit, setNlEdit] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildSteps, setBuildSteps] = useState<Array<{ id: string; label: string; status: string; detail?: string }>>([]);
  const [buildElapsedSec, setBuildElapsedSec] = useState(0);
  const [publicUrl, setPublicUrl] = useState<string | undefined>();
  const [appSlug, setAppSlug] = useState<string | undefined>();
  const [iterateNote, setIterateNote] = useState("");

  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setStage(d.stage);
      setPrompt(d.prompt);
      setPlan(d.plan);
      setPlanVersion(d.planVersion || 0);
      setPlanHistory(d.planHistory || []);
      setPublicUrl(d.publicUrl);
      setAppSlug(d.appSlug);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft({ stage, prompt, plan, planVersion, planHistory, publicUrl, appSlug });
  }, [hydrated, stage, prompt, plan, planVersion, planHistory, publicUrl, appSlug]);

  const planValidity = validateForgePlan(plan);

  const research = useCallback(async (fromPrompt?: string) => {
    const p = (fromPrompt ?? prompt).trim();
    if (!p) {
      toast("Describe the product you want to build.", "error");
      return;
    }
    setPrompt(p);
    setPlan(null);
    setPlanVersion(0);
    setPlanHistory([]);
    setPublicUrl(undefined);
    setAppSlug(undefined);
    setLoadingPlan(true);
    setStage("plan");
    try {
      const res = await fetch("/api/builder-v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = (await res.json()) as { plan?: ForgeBuildPlan; source?: string; error?: string };
      if (!res.ok || !data.plan) {
        toast(data.error || "Could not research this idea", "error");
        setStage("intake");
        return;
      }
      setPlan(data.plan);
      setPlanVersion(1);
      setPlanHistory([
        { version: 1, at: new Date().toISOString(), note: `Researched (${data.source || "app-builder-v2"})` },
      ]);
      setHighlightSections(["productSummary", "roles", "dataModels", "features", "screens"]);
      setTimeout(() => setHighlightSections([]), 2500);
      toast(
        data.plan.competitors?.length
          ? `Plan ready — found ${data.plan.competitors.length} competitor${data.plan.competitors.length > 1 ? "s" : ""} to learn from.`
          : "Plan ready. Review it, then build.",
        "success"
      );
    } catch {
      toast("Research failed. Check your connection.", "error");
      setStage("intake");
    } finally {
      setLoadingPlan(false);
    }
  }, [prompt, toast]);

  async function applyNlEdit() {
    if (!plan || !nlEdit.trim()) return;
    setLoadingEdit(true);
    try {
      const res = await fetch("/api/forge/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, instruction: nlEdit.trim(), action: "edit" }),
      });
      const data = (await res.json()) as { plan?: ForgeBuildPlan; changedSections?: string[]; note?: string; error?: string };
      if (!res.ok || !data.plan) {
        toast(data.error || "Could not edit plan", "error");
        return;
      }
      const v = planVersion + 1;
      setPlan({ ...data.plan, competitors: plan.competitors });
      setPlanVersion(v);
      setPlanHistory((h) => [...h, { version: v, at: new Date().toISOString(), note: data.note || nlEdit.trim() }]);
      setHighlightSections(data.changedSections || ["all"]);
      setTimeout(() => setHighlightSections([]), 2500);
      setNlEdit("");
      toast("Plan updated", "success");
    } catch {
      toast("Edit failed", "error");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function regenerateSection(section: string) {
    if (!plan) return;
    setRegeneratingSection(section);
    try {
      const res = await fetch("/api/forge/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, action: "regenerate", section }),
      });
      const data = (await res.json()) as { plan?: ForgeBuildPlan; note?: string };
      if (data.plan) {
        setPlan({ ...data.plan, competitors: plan.competitors });
        setHighlightSections([section]);
        setTimeout(() => setHighlightSections([]), 2000);
        toast(data.note || "Section regenerated", "success");
      }
    } catch {
      toast("Regenerate failed", "error");
    } finally {
      setRegeneratingSection(null);
    }
  }

  async function handleBuild() {
    if (!plan || !planValidity.valid) {
      toast(planValidity.errors[0] || "Plan is not valid yet", "error");
      return;
    }
    setStage("build");
    setBuilding(true);
    setBuildElapsedSec(0);
    setBuildSteps([
      { id: "plan", label: "Setting up your project", status: "running" },
      { id: "content", label: "Writing real content for every page", status: "pending" },
      { id: "roles", label: "Setting up accounts & permissions", status: "pending" },
      { id: "data", label: "Adding sample data", status: "pending" },
      { id: "publish", label: "Publishing your live link", status: "pending" },
    ]);

    const elapsedTimer = setInterval(() => {
      setBuildElapsedSec((s) => s + 1);
    }, 1000);

    type StreamEvent =
      | { type: "progress"; id: string; label: string; status: string; detail?: string }
      | {
          type: "done";
          project: { slug: string; publicPath: string; name: string };
          publicUrl: string;
          buildSteps: Array<{ id: string; label: string; status: string }>;
        }
      | { type: "error"; error: string };

    try {
      const res = await fetch("/api/builder-v2/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, plan }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Build failed" }));
        toast(data.error || "Build failed", "error");
        setStage("plan");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }

          if (evt.type === "progress") {
            setBuildSteps((steps) =>
              steps.map((s) => (s.id === evt.id ? { ...s, status: evt.status, detail: evt.detail } : s))
            );
          } else if (evt.type === "done") {
            finished = true;
            setBuildSteps(evt.buildSteps.map((s) => ({ ...s, status: "done" })));
            setPublicUrl(evt.publicUrl || evt.project.publicPath);
            setAppSlug(evt.project.slug);
            setStage("preview");
            toast(`${evt.project.name} is live!`, "success");
          } else if (evt.type === "error") {
            finished = true;
            toast(evt.error || "Build failed", "error");
            setStage("plan");
          }
        }
      }

      if (!finished) {
        toast("Build ended unexpectedly. Try again.", "error");
        setStage("plan");
      }
    } catch {
      toast("Build failed. Try again.", "error");
      setStage("plan");
    } finally {
      clearInterval(elapsedTimer);
      setBuilding(false);
    }
  }

  async function handleIterate() {
    if (!iterateNote.trim() || !plan) return;
    setStage("plan");
    setLoadingEdit(true);
    try {
      const res = await fetch("/api/forge/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, instruction: iterateNote.trim(), action: "edit" }),
      });
      const data = (await res.json()) as { plan?: ForgeBuildPlan; note?: string };
      if (data.plan) {
        setPlan({ ...data.plan, competitors: plan.competitors });
        setPlanVersion((v) => v + 1);
        toast("Plan updated from your change. Review and click Build again.", "success");
      }
      setIterateNote("");
    } finally {
      setLoadingEdit(false);
    }
  }

  function resetProject() {
    if (!window.confirm("Start a new product? Current draft will be cleared.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setStage("intake");
    setPrompt("");
    setPlan(null);
    setPublicUrl(undefined);
    setAppSlug(undefined);
    setPlanHistory([]);
    setPlanVersion(0);
  }

  function jumpStage(s: V2Stage) {
    if (s === "plan" && !plan) return;
    if (s === "build" && !plan) return;
    if (s === "preview" && !publicUrl) return;
    setStage(s);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading App Builder V2…
      </div>
    );
  }

  // ——— INTAKE ———
  if (stage === "intake") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1 text-xs font-semibold text-accent-teal">
            <Search className="h-3.5 w-3.5" />
            App Builder V2
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One prompt. Deep research. A real working product.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Describe anything you want to build — we research the space (including who
            you&apos;re up against), draft an editable plan, then build the complete,
            working product with Verlin Labs&apos; own UI.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <label className="block text-sm font-medium text-foreground">
            What do you want to build?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="e.g. A subscription box service for coffee lovers, with roasters, plans, and delivery tracking…"
            className="mt-2 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {FORGE_EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setPrompt(ex.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent-teal/50 hover:bg-accent-teal/10"
              >
                <span>{ex.emoji}</span>
                {ex.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="cta"
              size="lg"
              loading={loadingPlan}
              onClick={() => void research()}
              disabled={!prompt.trim()}
            >
              Research & draft plan
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              No interview — one prompt, real research, an editable plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ——— TWO-PANEL WORKSPACE (plan / build / preview) ———
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white dark:bg-accent-teal dark:text-navy">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">App Builder V2</p>
              <p className="max-w-[14rem] truncate text-[11px] text-muted-foreground sm:max-w-xs">
                {prompt || "New product"}
              </p>
            </div>
          </div>
          <V2StageIndicator stage={stage} onJump={jumpStage} />
          <button
            type="button"
            onClick={resetProject}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            New project
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
        {/* LEFT: research / controls */}
        <div className="flex min-h-[50vh] flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {stage === "plan" && "Research & plan"}
            {stage === "build" && "Build progress"}
            {stage === "preview" && "Iterate & deploy"}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingPlan && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching your idea and competitors…
              </div>
            )}

            {plan?.competitors && plan.competitors.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Who you&apos;re up against
                </p>
                <div className="space-y-3">
                  {plan.competitors.map((c, i) => (
                    <div key={`${c.name}_${i}`} className="rounded-xl border border-border/70 bg-muted/15 p-3">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Does well:</span> {c.whatTheyDoWell}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="font-medium">Your opening:</span> {c.gap}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan && stage === "plan" && !loadingPlan && (
              <p className="text-sm text-foreground">
                Plan ready for <span className="font-semibold">{plan.brandName}</span>. Edit
                anything on the canvas, or describe a change below.
              </p>
            )}
          </div>

          {/* Plan NL edit */}
          {stage === "plan" && plan && (
            <div className="border-t border-border bg-card/50 p-4 space-y-3">
              <label className="text-xs font-medium text-muted-foreground">
                Change the plan in plain language
              </label>
              <div className="flex gap-2">
                <input
                  value={nlEdit}
                  onChange={(e) => setNlEdit(e.target.value)}
                  placeholder='e.g. "Add a loyalty program" or "Remove the admin role"'
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-teal"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void applyNlEdit();
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  loading={loadingEdit}
                  onClick={() => void applyNlEdit()}
                  disabled={!nlEdit.trim()}
                >
                  Apply
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="cta"
                  loading={building}
                  disabled={!planValidity.valid}
                  onClick={() => void handleBuild()}
                >
                  <Rocket className="h-4 w-4" />
                  Build this product
                </Button>
                {!planValidity.valid && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {planValidity.errors.join(" · ")}
                  </p>
                )}
              </div>
              {planHistory.length > 0 && (
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <History className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    v{planVersion}
                    {planHistory.slice(-2).map((h) => (
                      <span key={h.version} className="block">
                        v{h.version}: {h.note}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Build steps */}
          {stage === "build" && (
            <div className="space-y-2 border-t border-border p-4">
              {building ? (
                <p className="text-xs text-text-muted">
                  Building for real — this writes actual content for every page, so it can take
                  a minute or two. {buildElapsedSec > 0 ? `(${buildElapsedSec}s elapsed)` : ""}
                </p>
              ) : null}
              {buildSteps.map((s) => (
                <div key={s.id} className="text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    {s.status === "done" ? (
                      <Check className="h-4 w-4 text-accent-teal" />
                    ) : s.status === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent-teal" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-border" />
                    )}
                    {s.label}
                  </div>
                  {s.detail ? (
                    <p className="ml-6 mt-0.5 text-xs text-text-muted">{s.detail}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Preview iterate */}
          {stage === "preview" && publicUrl && (
            <div className="space-y-3 border-t border-border p-4">
              <p className="text-sm text-foreground">
                Your product is live. Request a change or re-open the plan.
              </p>
              <input
                value={iterateNote}
                onChange={(e) => setIterateNote(e.target.value)}
                placeholder="e.g. Add a referral program"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-teal"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  loading={loadingEdit}
                  onClick={() => void handleIterate()}
                  disabled={!iterateNote.trim()}
                >
                  Update plan from this
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setStage("plan")}
                >
                  Re-open plan
                </Button>
                <Link
                  href={publicUrl}
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium hover:border-accent-teal/50"
                >
                  Open live app
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: plan canvas or preview */}
        <div className="flex min-h-[50vh] flex-col bg-muted/10 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" />
              {stage === "preview" ? "Live preview" : "Plan canvas"}
            </p>

            {stage === "preview" && appSlug && (
              <span className="text-[11px] text-muted-foreground">/apps/{appSlug}</span>
            )}
          </div>

          {stage === "preview" && publicUrl ? (
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 truncate text-[11px] text-muted-foreground">{publicUrl}</span>
              </div>
              <iframe title="Product preview" src={publicUrl} className="min-h-[60vh] w-full flex-1 bg-white" />
            </div>
          ) : (
            <PlanCanvas
              plan={plan}
              empty={!plan && stage !== "plan"}
              highlightSections={highlightSections}
              regeneratingSection={regeneratingSection}
              onChange={setPlan}
              onRegenerateSection={(s) => void regenerateSection(s)}
            />
          )}

          {loadingPlan && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 lg:static lg:mt-4 lg:bg-transparent">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching the market & drafting your plan…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
