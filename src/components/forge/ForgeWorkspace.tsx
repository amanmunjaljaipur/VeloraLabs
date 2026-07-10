"use client";

import { PlanCanvas } from "@/components/forge/PlanCanvas";
import { StageIndicator } from "@/components/forge/StageIndicator";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { FORGE_EXAMPLE_PROMPTS } from "@/lib/forge/archetypes";
import { validateForgePlan } from "@/lib/forge/plan-edit";
import type {
  DiscoveryAnswer,
  DiscoveryBatch,
  ForgeBuildPlan,
  ForgeStage,
  ProductArchetype,
} from "@/lib/forge/types";
import type { InterviewQuestion } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Flame,
  History,
  Loader2,
  MessageSquare,
  Rocket,
  SkipForward,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "forge-draft-v1";

type ChatLine = {
  id: string;
  role: "system" | "assistant" | "user";
  text: string;
};

type PersistedDraft = {
  stage: ForgeStage;
  prompt: string;
  answers: DiscoveryAnswer[];
  plan: ForgeBuildPlan | null;
  planVersion: number;
  understanding: string;
  archetype: ProductArchetype | null;
  batchesAsked: number;
  publicUrl?: string;
  appSlug?: string;
  planHistory: Array<{ version: number; at: string; note: string }>;
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

export function ForgeWorkspace() {
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<ForgeStage>("intake");
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<DiscoveryAnswer[]>([]);
  const [batch, setBatch] = useState<DiscoveryBatch | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchesAsked, setBatchesAsked] = useState(0);
  const [currentQi, setCurrentQi] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [customDraft, setCustomDraft] = useState("");
  const [understanding, setUnderstanding] = useState("");
  const [archetype, setArchetype] = useState<ProductArchetype | null>(null);
  const [plan, setPlan] = useState<ForgeBuildPlan | null>(null);
  const [planVersion, setPlanVersion] = useState(0);
  const [planHistory, setPlanHistory] = useState<
    Array<{ version: number; at: string; note: string }>
  >([]);
  const [highlightSections, setHighlightSections] = useState<string[]>([]);
  const [nlEdit, setNlEdit] = useState("");
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(
    null
  );
  const [building, setBuilding] = useState(false);
  const [buildSteps, setBuildSteps] = useState<
    Array<{ id: string; label: string; status: string }>
  >([]);
  const [publicUrl, setPublicUrl] = useState<string | undefined>();
  const [appSlug, setAppSlug] = useState<string | undefined>();
  const [iterateNote, setIterateNote] = useState("");

  // Hydrate from localStorage
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setStage(d.stage);
      setPrompt(d.prompt);
      setAnswers(d.answers || []);
      setPlan(d.plan);
      setPlanVersion(d.planVersion || 0);
      setUnderstanding(d.understanding || "");
      setArchetype(d.archetype);
      setBatchesAsked(d.batchesAsked || 0);
      setPublicUrl(d.publicUrl);
      setAppSlug(d.appSlug);
      setPlanHistory(d.planHistory || []);
      if (d.stage !== "intake" && d.prompt) {
        setChat([
          {
            id: "resume",
            role: "system",
            text: "Welcome back — we restored your Forge project from autosave.",
          },
        ]);
      }
    }
    setHydrated(true);
  }, []);

  // Autosave
  useEffect(() => {
    if (!hydrated) return;
    saveDraft({
      stage,
      prompt,
      answers,
      plan,
      planVersion,
      understanding,
      archetype,
      batchesAsked,
      publicUrl,
      appSlug,
      planHistory,
    });
  }, [
    hydrated,
    stage,
    prompt,
    answers,
    plan,
    planVersion,
    understanding,
    archetype,
    batchesAsked,
    publicUrl,
    appSlug,
    planHistory,
  ]);

  const questions = batch?.questions || [];
  const currentQ: InterviewQuestion | null = questions[currentQi] ?? null;
  const progress = batch?.progress ?? (stage === "intake" ? 0 : 10);

  const planValidity = useMemo(() => validateForgePlan(plan), [plan]);

  const pushChat = useCallback((line: Omit<ChatLine, "id">) => {
    setChat((prev) => [
      ...prev,
      { ...line, id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
    ]);
  }, []);

  async function startDiscovery(fromPrompt?: string) {
    const p = (fromPrompt ?? prompt).trim();
    if (!p) {
      toast("Describe the product you want to build.", "error");
      return;
    }
    setPrompt(p);
    setAnswers([]);
    setPlan(null);
    setPlanVersion(0);
    setBatchesAsked(0);
    setBatchIndex(0);
    setCurrentQi(0);
    setDraftAnswer("");
    setPublicUrl(undefined);
    setAppSlug(undefined);
    setLoadingDiscovery(true);
    setStage("discovery");
    setChat([
      {
        id: "start",
        role: "user",
        text: p,
      },
    ]);
    try {
      const res = await fetch("/api/forge/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, priorAnswers: [], batchIndex: 0 }),
      });
      const data = (await res.json()) as DiscoveryBatch & { error?: string };
      if (!res.ok) {
        toast(data.error || "Could not start discovery", "error");
        setStage("intake");
        return;
      }
      setBatch(data);
      setArchetype(data.archetype);
      setUnderstanding(data.understanding);
      setBatchesAsked(1);
      pushChat({
        role: "assistant",
        text:
          data.rationale ||
          `I'll ask a few focused questions about your ${data.archetype.replace(/_/g, " ")} idea.`,
      });
      if (data.complete || !data.questions?.length) {
        await generatePlan(p, []);
      } else if (data.questions[0]) {
        pushChat({ role: "assistant", text: data.questions[0].label });
      }
    } catch {
      toast("Discovery failed. Check your connection.", "error");
      setStage("intake");
    } finally {
      setLoadingDiscovery(false);
    }
  }

  function selectChip(q: InterviewQuestion, suggestion: string) {
    const mode = q.selectMode || "single";
    if (mode === "multi") {
      const parts = draftAnswer
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      const next = parts.includes(suggestion)
        ? parts.filter((x) => x !== suggestion)
        : [...parts, suggestion];
      setDraftAnswer(next.join(", "));
      return;
    }
    setDraftAnswer(suggestion);
  }

  function isChipSelected(suggestion: string): boolean {
    if (!draftAnswer) return false;
    if (currentQ?.selectMode === "multi") {
      return draftAnswer
        .split(/,\s*/)
        .map((s) => s.trim())
        .includes(suggestion);
    }
    return draftAnswer === suggestion;
  }

  async function commitAnswer(opts?: {
    skip?: boolean;
    smartDefault?: boolean;
  }) {
    if (!currentQ) return;
    let answer = draftAnswer.trim();
    let usedDefault = false;

    if (opts?.smartDefault) {
      const res = await fetch("/api/forge/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "default",
          prompt,
          question: currentQ,
          archetype: archetype || "custom",
        }),
      });
      const data = (await res.json()) as { answer?: string; assumption?: string };
      answer = data.answer || currentQ.suggestions?.[0] || "Default for v1";
      usedDefault = true;
      if (data.assumption) {
        pushChat({
          role: "system",
          text: `Smart default: ${data.assumption}`,
        });
      }
    }

    if (opts?.skip) {
      answer = "";
    }

    if (!opts?.skip && !answer && !opts?.smartDefault) {
      // allow empty only if skip
      if (customDraft.trim()) {
        answer = customDraft.trim();
      } else {
        toast("Pick an option, type an answer, skip, or use a smart default.", "error");
        return;
      }
    }

    const record: DiscoveryAnswer = {
      questionId: currentQ.id,
      question: currentQ.label,
      answer: opts?.skip ? "" : answer,
      usedDefault,
      skipped: Boolean(opts?.skip),
    };

    const nextAnswers = [
      ...answers.filter((a) => a.questionId !== currentQ.id),
      record,
    ];
    setAnswers(nextAnswers);

    if (!opts?.skip) {
      pushChat({ role: "user", text: usedDefault ? `${answer} (default)` : answer });
    } else {
      pushChat({ role: "user", text: "Skipped" });
    }

    setDraftAnswer("");
    setCustomDraft("");

    // Next question in batch
    if (currentQi < questions.length - 1) {
      const nextQ = questions[currentQi + 1];
      setCurrentQi((i) => i + 1);
      if (nextQ) pushChat({ role: "assistant", text: nextQ.label });
      return;
    }

    // End of batch — fetch next or plan
    await fetchNextBatchOrPlan(nextAnswers);
  }

  async function fetchNextBatchOrPlan(prior: DiscoveryAnswer[]) {
    setLoadingDiscovery(true);
    try {
      const res = await fetch("/api/forge/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          priorAnswers: prior,
          batchIndex: batchIndex + 1,
        }),
      });
      const data = (await res.json()) as DiscoveryBatch & { error?: string };
      if (!res.ok) {
        toast(data.error || "Could not continue discovery", "error");
        return;
      }
      setBatch(data);
      setBatchIndex((i) => i + 1);
      setBatchesAsked((n) => n + 1);
      setArchetype(data.archetype);
      setUnderstanding(data.understanding);
      setCurrentQi(0);

      if (data.complete || !data.questions?.length) {
        pushChat({
          role: "assistant",
          text: "I have enough to draft your build plan. Generating it now…",
        });
        await generatePlan(prompt, prior);
        return;
      }

      pushChat({
        role: "assistant",
        text:
          data.rationale ||
          "A few more questions to nail the details.",
      });
      if (data.questions[0]) {
        pushChat({ role: "assistant", text: data.questions[0].label });
      }
    } catch {
      toast("Could not load next questions.", "error");
    } finally {
      setLoadingDiscovery(false);
    }
  }

  async function finishDiscoveryEarly() {
    pushChat({
      role: "user",
      text: "That's enough — build the plan from what we have.",
    });
    await generatePlan(prompt, answers);
  }

  async function generatePlan(p: string, ans: DiscoveryAnswer[]) {
    setLoadingPlan(true);
    setStage("plan");
    try {
      const res = await fetch("/api/forge/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, answers: ans }),
      });
      const data = (await res.json()) as {
        plan?: ForgeBuildPlan;
        source?: string;
        error?: string;
      };
      if (!res.ok || !data.plan) {
        toast(data.error || "Could not generate plan", "error");
        return;
      }
      setPlan(data.plan);
      setPlanVersion(1);
      setPlanHistory([
        {
          version: 1,
          at: new Date().toISOString(),
          note: `Initial plan (${data.source || "forge"})`,
        },
      ]);
      setHighlightSections([
        "productSummary",
        "roles",
        "dataModels",
        "features",
        "screens",
      ]);
      setTimeout(() => setHighlightSections([]), 2500);
      pushChat({
        role: "assistant",
        text: `Plan ready for ${data.plan.brandName}. Edit anything on the canvas, or describe a change below.`,
      });
      toast("Review and edit your plan, then build.", "success");
    } catch {
      toast("Plan generation failed.", "error");
    } finally {
      setLoadingPlan(false);
    }
  }

  async function applyNlEdit() {
    if (!plan || !nlEdit.trim()) return;
    setLoadingEdit(true);
    try {
      const res = await fetch("/api/forge/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          instruction: nlEdit.trim(),
          action: "edit",
        }),
      });
      const data = (await res.json()) as {
        plan?: ForgeBuildPlan;
        changedSections?: string[];
        note?: string;
        error?: string;
      };
      if (!res.ok || !data.plan) {
        toast(data.error || "Could not edit plan", "error");
        return;
      }
      const v = planVersion + 1;
      setPlan(data.plan);
      setPlanVersion(v);
      setPlanHistory((h) => [
        ...h,
        {
          version: v,
          at: new Date().toISOString(),
          note: data.note || nlEdit.trim(),
        },
      ]);
      setHighlightSections(data.changedSections || ["all"]);
      setTimeout(() => setHighlightSections([]), 2500);
      pushChat({ role: "user", text: nlEdit.trim() });
      pushChat({
        role: "assistant",
        text: data.note || "Plan updated.",
      });
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
        body: JSON.stringify({
          plan,
          action: "regenerate",
          section,
        }),
      });
      const data = (await res.json()) as {
        plan?: ForgeBuildPlan;
        note?: string;
      };
      if (data.plan) {
        setPlan(data.plan);
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
    setBuildSteps([
      { id: "roles", label: "User roles & auth", status: "running" },
      { id: "data", label: "Data models & seed data", status: "pending" },
      { id: "features", label: "Features & modules", status: "pending" },
      { id: "screens", label: "Screens & UI", status: "pending" },
      { id: "publish", label: "Publish live link", status: "pending" },
    ]);

    // Animate steps while request runs
    const timers = [400, 900, 1400, 1900].map((ms, i) =>
      setTimeout(() => {
        setBuildSteps((steps) =>
          steps.map((s, idx) =>
            idx <= i
              ? { ...s, status: idx === i ? "running" : "done" }
              : s
          )
        );
      }, ms)
    );

    try {
      const res = await fetch("/api/forge/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, plan, answers }),
      });
      const data = (await res.json()) as {
        project?: { slug: string; publicPath: string; name: string };
        publicUrl?: string;
        buildSteps?: Array<{ id: string; label: string; status: string }>;
        error?: string;
      };
      timers.forEach(clearTimeout);
      if (!res.ok || !data.project) {
        toast(data.error || "Build failed", "error");
        setStage("plan");
        return;
      }
      setBuildSteps(
        (data.buildSteps || []).map((s) => ({ ...s, status: "done" }))
      );
      setPublicUrl(data.publicUrl || data.project.publicPath);
      setAppSlug(data.project.slug);
      setStage("preview");
      toast(`${data.project.name} is live!`, "success");
    } catch {
      timers.forEach(clearTimeout);
      toast("Build failed. Try again.", "error");
      setStage("plan");
    } finally {
      setBuilding(false);
    }
  }

  async function handleIterate() {
    if (!iterateNote.trim() || !plan) return;
    setNlEdit(iterateNote);
    setStage("plan");
    // Apply as plan edit then user can rebuild
    setLoadingEdit(true);
    try {
      const res = await fetch("/api/forge/plan/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          instruction: iterateNote.trim(),
          action: "edit",
        }),
      });
      const data = (await res.json()) as {
        plan?: ForgeBuildPlan;
        note?: string;
      };
      if (data.plan) {
        setPlan(data.plan);
        setPlanVersion((v) => v + 1);
        toast(
          "Plan updated from your change. Review and click Build again.",
          "success"
        );
      }
      setIterateNote("");
    } finally {
      setLoadingEdit(false);
    }
  }

  function resetProject() {
    if (!window.confirm("Start a new product? Current draft will be cleared."))
      return;
    localStorage.removeItem(STORAGE_KEY);
    setStage("intake");
    setPrompt("");
    setAnswers([]);
    setBatch(null);
    setPlan(null);
    setChat([]);
    setPublicUrl(undefined);
    setAppSlug(undefined);
    setUnderstanding("");
    setArchetype(null);
    setPlanHistory([]);
    setPlanVersion(0);
  }

  function jumpStage(s: ForgeStage) {
    const order: ForgeStage[] = [
      "intake",
      "discovery",
      "plan",
      "build",
      "preview",
    ];
    const cur = order.indexOf(stage);
    const next = order.indexOf(s);
    if (next > cur + 1 && s !== "plan") return;
    if (s === "plan" && !plan) return;
    if (s === "preview" && !publicUrl) return;
    if (s === "build" && !plan) return;
    setStage(s);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Forge…
      </div>
    );
  }

  // ——— INTAKE ———
  if (stage === "intake") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1 text-xs font-semibold text-accent-teal">
            <Flame className="h-3.5 w-3.5" />
            Forge
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From one sentence to a working product
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We interview you first, draft an editable build plan, then build —
            so you stay in control every step.
          </p>
        </div>

        <StageIndicator stage="intake" />

        <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <label className="block text-sm font-medium text-foreground">
            Describe the product you want to build
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="e.g. A booking app for my yoga studio with memberships and class schedules…"
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
              loading={loadingDiscovery}
              onClick={() => void startDiscovery()}
              disabled={!prompt.trim()}
            >
              Start discovery
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              No code, no forms dump — just a short interview.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ——— TWO-PANEL WORKSPACE (discovery / plan / build / preview) ———
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white dark:bg-accent-teal dark:text-navy">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Forge</p>
              <p className="max-w-[14rem] truncate text-[11px] text-muted-foreground sm:max-w-xs">
                {prompt || "New product"}
              </p>
            </div>
          </div>
          <StageIndicator stage={stage} onJump={jumpStage} />
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
        {/* LEFT: chat / controls */}
        <div className="flex min-h-[50vh] flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {stage === "discovery" && "Discovery interview"}
            {stage === "plan" && "Plan coaching"}
            {stage === "build" && "Build progress"}
            {stage === "preview" && "Iterate & deploy"}
            {understanding && stage === "discovery" && (
              <span className="ml-auto hidden max-w-[50%] truncate text-[10px] sm:inline">
                {understanding.split("\n")[0]}
              </span>
            )}
          </div>

          {/* Progress bar in discovery */}
          {stage === "discovery" && (
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Discovery progress</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-teal transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {chat.map((line) => (
              <div
                key={line.id}
                className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm",
                  line.role === "user" &&
                    "ml-auto bg-navy text-white dark:bg-accent-teal dark:text-navy",
                  line.role === "assistant" &&
                    "bg-muted/70 text-foreground",
                  line.role === "system" &&
                    "mx-auto max-w-full border border-border bg-card text-center text-xs text-muted-foreground"
                )}
              >
                {line.text}
              </div>
            ))}
            {(loadingDiscovery || loadingPlan) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingPlan ? "Researching your build plan…" : "Thinking…"}
              </div>
            )}
          </div>

          {/* Discovery answer UI */}
          {stage === "discovery" && currentQ && !loadingPlan && (
            <div className="border-t border-border bg-card/50 p-4">
              <p className="text-sm font-medium text-foreground">
                {currentQ.label}
              </p>
              {currentQ.helpText && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {currentQ.helpText}
                </p>
              )}
              {currentQ.suggestions && currentQ.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentQ.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selectChip(currentQ, s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        isChipSelected(s)
                          ? "border-accent-teal bg-accent-teal/15 text-accent-teal"
                          : "border-border bg-background hover:border-accent-teal/40"
                      )}
                    >
                      {isChipSelected(s) && (
                        <Check className="mr-1 inline h-3 w-3" />
                      )}
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {(currentQ.allowCustom !== false ||
                currentQ.selectMode === "free") && (
                <input
                  value={
                    currentQ.selectMode === "free" ? draftAnswer : customDraft
                  }
                  onChange={(e) =>
                    currentQ.selectMode === "free"
                      ? setDraftAnswer(e.target.value)
                      : setCustomDraft(e.target.value)
                  }
                  placeholder={
                    currentQ.placeholder || "Or type your own answer…"
                  }
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-teal"
                />
              )}
              {currentQ.selectMode === "multi" && draftAnswer && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Selected: {draftAnswer}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void commitAnswer()}
                  disabled={loadingDiscovery}
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void commitAnswer({ smartDefault: true })}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Smart default
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void commitAnswer({ skip: true })}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void finishDiscoveryEarly()}
                >
                  Enough — make plan
                </Button>
              </div>
            </div>
          )}

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
                  placeholder='e.g. "Add a wishlist feature" or "Remove the admin role"'
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
              {buildSteps.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  {s.status === "done" ? (
                    <Check className="h-4 w-4 text-accent-teal" />
                  ) : s.status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent-teal" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-border" />
                  )}
                  {s.label}
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
                placeholder="e.g. Make bookings recurring"
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
              <Sparkles className="h-3.5 w-3.5" />
              {stage === "preview" ? "Live preview" : "Plan canvas"}
            </p>
            {stage === "preview" && appSlug && (
              <span className="text-[11px] text-muted-foreground">
                /apps/{appSlug}
              </span>
            )}
          </div>

          {stage === "preview" && publicUrl ? (
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 truncate text-[11px] text-muted-foreground">
                  {publicUrl}
                </span>
              </div>
              <iframe
                title="Product preview"
                src={publicUrl}
                className="min-h-[60vh] w-full flex-1 bg-white"
              />
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
                Drafting editable plan…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
