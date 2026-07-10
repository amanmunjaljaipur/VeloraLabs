"use client";

import { AppBuilderVision } from "@/components/admin/AppBuilderVision";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { AppExtensionMeta } from "@/lib/app-builder/extensions";
import type {
  AppIdeaExample,
  AppInterviewAnswer,
  AppProject,
  InterviewQuestion,
  LlmProviderKind,
} from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  FolderOpen,
  HeartHandshake,
  KeyRound,
  Lightbulb,
  Loader2,
  MapPin,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Step = "idea" | "guide" | "extras" | "ai" | "result";

interface LlmProviderOption {
  id: LlmProviderKind;
  label: string;
  plainLabel?: string;
  defaultModel: string;
  baseUrl: string;
  hint: string;
}

function parseAnswerList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinAnswerList(items: string[]): string {
  return items.join(", ");
}

export function AppBuilderStudio() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"build" | "vision">("build");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [extensions, setExtensions] = useState<AppExtensionMeta[]>([]);
  const [ideaExamples, setIdeaExamples] = useState<AppIdeaExample[]>([]);
  const [llmProviders, setLlmProviders] = useState<LlmProviderOption[]>([]);

  const [step, setStep] = useState<Step>("idea");
  const [prompt, setPrompt] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [extensionId, setExtensionId] = useState("ecom-local-shop");
  /** Designed per-prompt by product-manager AI — not a fixed list */
  const [dynamicQuestions, setDynamicQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewRationale, setInterviewRationale] = useState("");
  const [interviewDesignedBy, setInterviewDesignedBy] = useState("");
  const [designingQuestions, setDesigningQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [customDraft, setCustomDraft] = useState("");
  const [customPoints, setCustomPoints] = useState<string[]>([]);
  const [extraDraft, setExtraDraft] = useState("");

  const [provider, setProvider] = useState<LlmProviderKind>("xai");
  const [model, setModel] = useState("grok-3-mini");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showAdvancedAi, setShowAdvancedAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeProject, setActiveProject] = useState<AppProject | null>(null);

  const extension = useMemo(
    () => extensions.find((e) => e.id === extensionId) ?? null,
    [extensions, extensionId]
  );

  const questions = dynamicQuestions;
  const currentQ: InterviewQuestion | null = questions[questionIndex] ?? null;
  const progressPct =
    questions.length > 0 ? Math.round(((questionIndex + 1) / questions.length) * 100) : 0;

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/app-builder");
    if (!res.ok) {
      toast("Could not load App Builder. Try again.", "error");
      return;
    }
    const data = (await res.json()) as {
      projects: AppProject[];
      extensions: AppExtensionMeta[];
      ideaExamples?: AppIdeaExample[];
      llmProviders: LlmProviderOption[];
    };
    setProjects(data.projects);
    setExtensions(data.extensions);
    setIdeaExamples(data.ideaExamples || []);
    setLlmProviders(data.llmProviders);
    if (data.extensions[0]) setExtensionId(data.extensions[0].id);
    if (data.llmProviders[0]) {
      setProvider(data.llmProviders[0].id);
      setModel(data.llmProviders[0].defaultModel);
      if (data.llmProviders[0].id !== "custom") {
        setBaseUrl(data.llmProviders[0].baseUrl);
      }
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  function selectProvider(id: LlmProviderKind) {
    setProvider(id);
    const p = llmProviders.find((x) => x.id === id);
    if (p) {
      setModel(p.defaultModel);
      if (id !== "custom") setBaseUrl(p.baseUrl);
      else setBaseUrl("");
    }
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleSuggestion(q: InterviewQuestion, suggestion: string) {
    const mode = q.selectMode || "free";
    if (mode === "single") {
      setAnswer(q.id, suggestion);
      return;
    }
    if (mode === "multi") {
      const list = parseAnswerList(answers[q.id]);
      const next = list.includes(suggestion)
        ? list.filter((x) => x !== suggestion)
        : [...list, suggestion];
      setAnswer(q.id, joinAnswerList(next));
      return;
    }
    // free: append if not already there
    const cur = answers[q.id]?.trim() || "";
    if (cur.includes(suggestion)) return;
    setAnswer(q.id, cur ? `${cur}\n${suggestion}` : suggestion);
  }

  function isSuggestionSelected(q: InterviewQuestion, suggestion: string): boolean {
    const mode = q.selectMode || "free";
    const val = answers[q.id] || "";
    if (mode === "single") return val === suggestion;
    if (mode === "multi") return parseAnswerList(val).includes(suggestion);
    return val.includes(suggestion);
  }

  function addCustomToQuestion(q: InterviewQuestion) {
    const text = customDraft.trim();
    if (!text) return;
    const mode = q.selectMode || "free";
    if (mode === "single") {
      setAnswer(q.id, text);
    } else if (mode === "multi") {
      const list = parseAnswerList(answers[q.id]);
      if (!list.includes(text)) setAnswer(q.id, joinAnswerList([...list, text]));
    } else {
      const cur = answers[q.id]?.trim() || "";
      setAnswer(q.id, cur ? `${cur}\n${text}` : text);
    }
    setCustomDraft("");
  }

  function addExtraPoint() {
    const text = extraDraft.trim();
    if (!text) return;
    if (customPoints.includes(text)) {
      setExtraDraft("");
      return;
    }
    setCustomPoints((prev) => [...prev, text].slice(0, 30));
    setExtraDraft("");
  }

  function buildAnswerList(): AppInterviewAnswer[] {
    return questions.map((q) => ({
      id: q.id,
      question: q.label,
      answer: answers[q.id]?.trim() || "",
    }));
  }

  function validateCurrentQuestion(): string | null {
    if (!currentQ) return "No question";
    if (currentQ.required && !answers[currentQ.id]?.trim()) {
      return "Please pick a suggestion or write your own answer — we need this to build your shop.";
    }
    return null;
  }

  /** Product-manager AI designs questions from this prompt (not a fixed checklist). */
  async function designQuestionsFromPrompt(): Promise<boolean> {
    if (!prompt.trim()) {
      toast("First describe your idea in simple words.", "error");
      return false;
    }
    setDesigningQuestions(true);
    try {
      const res = await fetch("/api/admin/app-builder/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          extensionId,
          // Optional: if they already pasted a key, use it for PM design
          apiKey: apiKey.trim() || undefined,
          provider,
          model,
          baseUrl: provider === "custom" ? baseUrl : undefined,
        }),
      });
      const data = (await res.json()) as {
        questions?: InterviewQuestion[];
        designedBy?: string;
        rationale?: string;
        error?: string;
        note?: string;
      };
      if (!res.ok || !data.questions?.length) {
        toast(data.error || "Could not design questions. Try again.", "error");
        return false;
      }
      setDynamicQuestions(data.questions);
      setInterviewDesignedBy(data.designedBy || "");
      setInterviewRationale(data.rationale || data.note || "");
      setAnswers({});
      setQuestionIndex(0);
      setCustomDraft("");
      return true;
    } catch {
      toast("Could not design questions. Check your connection.", "error");
      return false;
    } finally {
      setDesigningQuestions(false);
    }
  }

  async function startGuidedFromIdea() {
    const ok = await designQuestionsFromPrompt();
    if (ok) setStep("guide");
  }

  function goNextQuestion() {
    const err = validateCurrentQuestion();
    if (err) {
      toast(err, "error");
      return;
    }
    setCustomDraft("");
    if (questionIndex >= questions.length - 1) {
      setStep("extras");
      return;
    }
    setQuestionIndex((i) => i + 1);
  }

  function goPrevQuestion() {
    setCustomDraft("");
    if (questionIndex <= 0) {
      setStep("idea");
      return;
    }
    setQuestionIndex((i) => i - 1);
  }

  async function handleBuild() {
    if (!prompt.trim()) {
      toast("First tell us your shop idea in simple words.", "error");
      setStep("idea");
      return;
    }
    if (!extension) return;
    if (questions.length === 0) {
      toast("We need to design questions from your idea first.", "error");
      setStep("idea");
      return;
    }
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        toast(`Please answer: ${q.label}`, "error");
        setStep("guide");
        setQuestionIndex(questions.findIndex((x) => x.id === q.id));
        return;
      }
    }
    if (!apiKey.trim()) {
      toast("Paste your AI helper key so we can write the shop pages for you.", "error");
      setStep("ai");
      return;
    }

    setBusy(true);
    try {
      const createRes = await fetch("/api/admin/app-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          extensionId,
          answers: buildAnswerList(),
          customPoints,
          llm: {
            provider,
            model,
            baseUrl: provider === "custom" ? baseUrl : undefined,
          },
        }),
      });
      const createData = (await createRes.json()) as { project?: AppProject; error?: string };
      if (!createRes.ok || !createData.project) {
        toast(createData.error || "Could not start your shop project", "error");
        return;
      }

      const genRes = await fetch("/api/admin/app-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: createData.project.id,
          apiKey: apiKey.trim(),
          provider,
          model,
          baseUrl: provider === "custom" ? baseUrl : undefined,
          publish: true,
        }),
      });
      const genData = (await genRes.json()) as {
        project?: AppProject;
        publicUrl?: string;
        error?: string;
      };
      if (!genRes.ok || !genData.project) {
        toast(genData.error || "Could not finish building the shop", "error");
        await load();
        return;
      }

      setActiveProject(genData.project);
      setStep("result");
      setApiKey("");
      toast("Your shop website is ready!", "success");
      await load();
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/app-builder/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete", "error");
      return;
    }
    toast("Shop removed", "success");
    if (activeProject?.id === id) {
      setActiveProject(null);
      setStep("idea");
    }
    await load();
  }

  async function downloadHostingFolder(id: string, slug: string) {
    try {
      const res = await fetch(`/api/admin/app-builder/${id}/export`);
      const data = (await res.json()) as {
        files?: Record<string, string>;
        folder?: string;
        error?: string;
        howToHost?: string;
      };
      if (!res.ok || !data.files) {
        toast(data.error || "Could not prepare hosting folder", "error");
        return;
      }
      // Download each file (site/index.html is the main one for any host)
      for (const [rel, body] of Object.entries(data.files)) {
        const blob = new Blob([body], {
          type: rel.endsWith(".html")
            ? "text/html"
            : rel.endsWith(".json")
              ? "application/json"
              : "text/plain",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug}-${rel.replace(/\//g, "-")}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      toast(
        data.folder
          ? `Hosting files ready (also on disk: ${data.folder}). Upload site HTML to any host.`
          : "Hosting files downloaded",
        "success"
      );
    } catch {
      toast("Download failed", "error");
    }
  }

  function pickIdea(idea: AppIdeaExample) {
    setSelectedIdeaId(idea.id);
    if (idea.prompt) setPrompt(idea.prompt);
    if (idea.id === "custom") setPrompt("");
  }

  function resetWizard() {
    setStep("idea");
    setActiveProject(null);
    setPrompt("");
    setAnswers({});
    setCustomPoints([]);
    setQuestionIndex(0);
    setSelectedIdeaId(null);
    setCustomDraft("");
    setExtraDraft("");
    setDynamicQuestions([]);
    setInterviewRationale("");
    setInterviewDesignedBy("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Getting App Builder ready…
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-teal to-teal text-white shadow-md">
            <AppWindow className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">App Builder</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Describe your idea once. A product manager (AI) invents simple questions for{" "}
              <strong>that</strong> idea — with tap suggestions and room for your own words — then
              builds a full shop with city-based logo colours.
            </p>
          </div>
        </div>
        <div className="flex rounded-xl border border-border p-1">
          <button
            type="button"
            onClick={() => setTab("build")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "build" ? "bg-accent-teal text-white" : "text-text-secondary"
            }`}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setTab("vision")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "vision" ? "bg-accent-teal text-white" : "text-text-secondary"
            }`}
          >
            Vision
          </button>
        </div>
      </div>

      {tab === "vision" ? <AppBuilderVision /> : null}

      {tab === "build" ? (
        <>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {(
              [
                ["idea", "1. Your idea"],
                ["guide", "2. Guided questions"],
                ["extras", "3. Your own points"],
                ["ai", "4. AI helper"],
                ["result", "5. Live shop"],
              ] as const
            ).map(([id, label]) => (
              <span
                key={id}
                className={cn(
                  "rounded-full px-3 py-1",
                  step === id ? "bg-accent-teal text-white" : "bg-muted text-text-secondary"
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {/* STEP: IDEA */}
          {step === "idea" && (
            <Card className="space-y-6 p-5 md:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-accent-teal/20 bg-accent-teal/5 p-4">
                <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
                <div className="text-sm text-text-secondary">
                  <p className="font-semibold text-foreground">No coding. No design tools.</p>
                  <p className="mt-1">
                    Think of this like booking a free session: we guide you step by step. Tap an
                    idea that feels close, or write anything in your own words — spelling does not
                    matter.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold">What kind of shop do you want?</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Pick a starting idea (you can change every detail later).
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ideaExamples.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => pickIdea(idea)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition hover:border-accent-teal/50",
                        selectedIdeaId === idea.id
                          ? "border-accent-teal bg-accent-teal/5 shadow-sm"
                          : "border-border bg-card"
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {idea.emoji}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-foreground">
                        {idea.title}
                      </span>
                      <span className="mt-1 block text-xs text-text-secondary">
                        {idea.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Describe your shop in plain words
                </span>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setSelectedIdeaId((id) => (id === "custom" || !id ? "custom" : id));
                  }}
                  rows={4}
                  placeholder="Example: I sell handmade diyas and gift boxes from my home in Jaipur. Parents and tourists buy from me. I take orders on WhatsApp."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>

              {extensions[0] ? (
                <p className="text-xs text-text-muted">
                  We will build: <strong className="text-foreground">{extensions[0].plainLabel}</strong>
                </p>
              ) : null}

              <p className="text-xs text-text-secondary">
                Next we ask a product manager (AI) to invent questions that fit{" "}
                <strong>your</strong> idea — not the same list every time. Simple words only.
              </p>

              <Button
                type="button"
                disabled={!prompt.trim() || designingQuestions}
                loading={designingQuestions}
                onClick={() => void startGuidedFromIdea()}
              >
                {designingQuestions ? "Designing your questions…" : "Design questions for my idea"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* STEP: GUIDED QUESTIONS (one at a time) */}
          {step === "guide" && designingQuestions ? (
            <Card className="flex items-center justify-center gap-2 p-12 text-sm text-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin text-accent-teal" />
              Product manager is writing questions for your idea…
            </Card>
          ) : null}

          {step === "guide" && !designingQuestions && currentQ && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:text-foreground"
                  onClick={goPrevQuestion}
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back
                </button>
                <span className="text-xs font-medium text-text-muted">
                  Question {questionIndex + 1} of {questions.length}
                </span>
              </div>

              {(interviewRationale || interviewDesignedBy) && questionIndex === 0 ? (
                <div className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 px-3 py-2 text-xs text-text-secondary">
                  <p className="font-semibold text-foreground">Questions made for your idea</p>
                  {interviewRationale ? <p className="mt-1">{interviewRationale}</p> : null}
                  {interviewDesignedBy ? (
                    <p className="mt-1 text-text-muted">Source: {interviewDesignedBy}</p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-2 font-medium text-accent-teal underline"
                    disabled={designingQuestions}
                    onClick={() => void designQuestionsFromPrompt()}
                  >
                    Redesign questions from my idea
                  </button>
                </div>
              ) : null}

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-teal transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight">{currentQ.label}</h2>
                {currentQ.helpText ? (
                  <p className="mt-2 text-sm text-text-secondary">{currentQ.helpText}</p>
                ) : null}
              </div>

              {currentQ.id === "city" ? (
                <p className="flex items-center gap-1.5 text-xs text-accent-teal">
                  <MapPin className="h-3.5 w-3.5" />
                  Your city picks logo colours and product picture style automatically.
                </p>
              ) : null}

              {currentQ.suggestions && currentQ.suggestions.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Tap a suggestion
                    {currentQ.selectMode === "multi" ? " (pick as many as you like)" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentQ.suggestions.map((s) => {
                      const selected = isSuggestionSelected(currentQ, s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSuggestion(currentQ, s)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-left text-sm transition",
                            selected
                              ? "border-accent-teal bg-accent-teal text-white"
                              : "border-border bg-card text-foreground hover:border-accent-teal/40"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {(currentQ.allowCustom !== false ||
                currentQ.selectMode === "free" ||
                currentQ.multiline) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {currentQ.selectMode === "multi"
                      ? "Or add your own point"
                      : "Your answer (edit freely)"}
                  </p>
                  {currentQ.selectMode === "multi" ? (
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={customDraft}
                        onChange={(e) => setCustomDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomToQuestion(currentQ);
                          }
                        }}
                        placeholder="Type something that fits you…"
                        className="min-w-[12rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addCustomToQuestion(currentQ)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  ) : null}
                  {currentQ.multiline ? (
                    <textarea
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                      rows={4}
                      placeholder={currentQ.placeholder}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  ) : currentQ.selectMode !== "multi" ? (
                    <input
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                      placeholder={currentQ.placeholder}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  ) : answers[currentQ.id] ? (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                      {parseAnswerList(answers[currentQ.id]).map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-teal/10 px-2.5 py-1 text-xs font-medium text-accent-teal"
                        >
                          {item}
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            onClick={() => {
                              const next = parseAnswerList(answers[currentQ.id]).filter(
                                (x) => x !== item
                              );
                              setAnswer(currentQ.id, joinAnswerList(next));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={goNextQuestion}>
                  {questionIndex >= questions.length - 1 ? "Continue" : "Next question"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                {!currentQ.required ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCustomDraft("");
                      if (questionIndex >= questions.length - 1) setStep("extras");
                      else setQuestionIndex((i) => i + 1);
                    }}
                  >
                    Skip for now
                  </Button>
                ) : null}
              </div>
            </Card>
          )}

          {/* STEP: CUSTOM EXTRAS */}
          {step === "extras" && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Add your own points</h2>
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:text-foreground"
                  onClick={() => {
                    setQuestionIndex(Math.max(0, questions.length - 1));
                    setStep("guide");
                  }}
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                Anything else that matters to you — even if it feels small. These show up on your
                shop as “Why shop with us”. No tech words needed.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  "We pack gifts carefully",
                  "Same-day reply on WhatsApp",
                  "Student-friendly prices",
                  "Family recipe / traditional method",
                  "Only local materials",
                  "I am still learning — please be kind!",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (!customPoints.includes(s)) {
                        setCustomPoints((prev) => [...prev, s]);
                      }
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      customPoints.includes(s)
                        ? "border-accent-teal bg-accent-teal text-white"
                        : "border-border hover:border-accent-teal/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  value={extraDraft}
                  onChange={(e) => setExtraDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExtraPoint();
                    }
                  }}
                  placeholder="Write anything in your own words…"
                  className="min-w-[14rem] flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
                <Button type="button" variant="secondary" onClick={addExtraPoint}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add my point
                </Button>
              </div>

              {customPoints.length > 0 ? (
                <ul className="space-y-2">
                  {customPoints.map((p) => (
                    <li
                      key={p}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${p}`}
                        onClick={() => setCustomPoints((prev) => prev.filter((x) => x !== p))}
                        className="text-text-muted hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-muted">Optional — you can skip if you already said enough.</p>
              )}

              <Button type="button" onClick={() => setStep("ai")}>
                Continue to AI helper
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* STEP: AI KEY (plain language) */}
          {step === "ai" && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-accent-teal" />
                  <h2 className="text-lg font-semibold">Connect your AI helper</h2>
                </div>
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:text-foreground"
                  onClick={() => setStep("extras")}
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                Your AI helper writes product names, page text, and FAQ in simple language. You use{" "}
                <strong>your own</strong> key from Grok or Groq. We use it <strong>only once</strong>{" "}
                to build the shop — we <strong>never store</strong> the key.
              </p>

              <fieldset className="grid gap-2 sm:grid-cols-3">
                {llmProviders.map((p) => (
                  <label
                    key={p.id}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 text-sm",
                      provider === p.id ? "border-accent-teal bg-accent-teal/5" : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={provider === p.id}
                      onChange={() => selectProvider(p.id)}
                    />
                    <span className="font-semibold">{p.plainLabel || p.label}</span>
                    <span className="mt-1 block text-xs text-text-secondary">{p.hint}</span>
                  </label>
                ))}
              </fieldset>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Paste your AI key here *
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === "xai" ? "starts with xai-…" : provider === "groq" ? "starts with gsk_…" : "your key…"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                />
              </label>

              <button
                type="button"
                className="text-xs font-medium text-text-muted underline"
                onClick={() => setShowAdvancedAi((v) => !v)}
              >
                {showAdvancedAi ? "Hide advanced options" : "Show advanced options (model name)"}
              </button>

              {showAdvancedAi ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-text-secondary">
                      Model name
                    </span>
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                    />
                  </label>
                  {provider === "custom" ? (
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-text-secondary">
                        AI service link
                      </span>
                      <input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://…"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-text-secondary">
                <p className="font-semibold text-foreground">What happens next</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>We design a logo mark and colours from your city</li>
                  <li>We create product cards with friendly pictures (icons)</li>
                  <li>We publish a live shop link you can open on your phone</li>
                </ul>
              </div>

              <Button type="button" onClick={() => void handleBuild()} loading={busy} disabled={busy}>
                <Rocket className="mr-1.5 h-4 w-4" />
                {busy ? "Building your shop…" : "Build my shop website"}
              </Button>
            </Card>
          )}

          {/* STEP: RESULT */}
          {step === "result" && activeProject && (
            <Card className="space-y-4 border-accent-teal/30 p-5 md:p-6">
              <div className="flex items-center gap-2 text-teal">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-foreground">Your shop is live!</h2>
              </div>
              <p className="text-sm text-text-secondary">
                <strong>{activeProject.name}</strong> is ready to share with customers.
                {activeProject.content?.city
                  ? ` Colours and logo style match ${activeProject.content.city}.`
                  : null}
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-text-secondary">
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" />
                <div>
                  <p className="font-semibold text-foreground">Hosting folder</p>
                  <p className="mt-0.5 font-mono text-[11px]">
                    generated-apps/{activeProject.slug}/
                  </p>
                  <p className="mt-1">
                    Contains <code className="text-[11px]">project.json</code>,{" "}
                    <code className="text-[11px]">site/index.html</code>, and a README — upload the
                    site folder to Netlify, Hostinger, or any host.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={activeProject.publicPath} target="_blank">
                  <Button>
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Open my shop
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    void downloadHostingFolder(activeProject.id, activeProject.slug)
                  }
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download for hosting
                </Button>
                <Button variant="secondary" type="button" onClick={resetWizard}>
                  Build another shop
                </Button>
              </div>
            </Card>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your shops</h2>
            {projects.length === 0 ? (
              <Card className="p-6 text-center text-sm text-text-secondary">
                No shops yet. Start with an idea above — we will hold your hand through each step.
              </Card>
            ) : (
              projects.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    {p.content?.logo ? (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                        style={{
                          background: `linear-gradient(145deg, ${p.content.logo.bgFrom}, ${p.content.logo.bgTo})`,
                        }}
                      >
                        {p.content.logo.initials}
                      </div>
                    ) : null}
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-text-muted">
                        {p.status === "live" ? "Live" : p.status} · {p.publicPath}
                        {p.content?.city ? ` · ${p.content.city}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.status === "live" ? (
                      <>
                        <Link href={p.publicPath} target="_blank">
                          <Button variant="secondary" size="sm">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Open
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void downloadHostingFolder(p.id, p.slug)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Host folder
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void removeProject(p.id, p.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
