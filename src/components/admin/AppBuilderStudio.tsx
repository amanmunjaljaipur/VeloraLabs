"use client";

import { AppBuilderVision } from "@/components/admin/AppBuilderVision";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { AppExtensionMeta } from "@/lib/app-builder/extensions";
import type {
  AppInterviewAnswer,
  AppProject,
  LlmProviderKind,
} from "@/lib/app-builder/types";
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  KeyRound,
  Loader2,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Step = "prompt" | "questions" | "llm" | "result";

interface LlmProviderOption {
  id: LlmProviderKind;
  label: string;
  defaultModel: string;
  baseUrl: string;
  hint: string;
}

export function AppBuilderStudio() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"build" | "vision">("build");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [extensions, setExtensions] = useState<AppExtensionMeta[]>([]);
  const [llmProviders, setLlmProviders] = useState<LlmProviderOption[]>([]);

  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState("");
  const [extensionId, setExtensionId] = useState("ecom-local-shop");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [provider, setProvider] = useState<LlmProviderKind>("xai");
  const [model, setModel] = useState("grok-3-mini");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeProject, setActiveProject] = useState<AppProject | null>(null);

  const extension = useMemo(
    () => extensions.find((e) => e.id === extensionId) ?? null,
    [extensions, extensionId]
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/app-builder");
    if (!res.ok) {
      toast("Failed to load App Builder", "error");
      return;
    }
    const data = (await res.json()) as {
      projects: AppProject[];
      extensions: AppExtensionMeta[];
      llmProviders: LlmProviderOption[];
    };
    setProjects(data.projects);
    setExtensions(data.extensions);
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

  function buildAnswerList(): AppInterviewAnswer[] {
    if (!extension) return [];
    return extension.questions.map((q) => ({
      id: q.id,
      question: q.label,
      answer: answers[q.id]?.trim() || "",
    }));
  }

  function validateQuestions(): string | null {
    if (!extension) return "Select an extension";
    for (const q of extension.questions) {
      if (q.required && !answers[q.id]?.trim()) return `Please answer: ${q.label}`;
    }
    return null;
  }

  async function handleBuild() {
    if (!prompt.trim()) {
      toast("Enter a product prompt first", "error");
      return;
    }
    const qErr = validateQuestions();
    if (qErr) {
      toast(qErr, "error");
      setStep("questions");
      return;
    }
    if (!apiKey.trim()) {
      toast("Paste your LLM API key (Grok / Groq / custom)", "error");
      setStep("llm");
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
          llm: { provider, model, baseUrl: provider === "custom" ? baseUrl : undefined },
        }),
      });
      const createData = (await createRes.json()) as { project?: AppProject; error?: string };
      if (!createRes.ok || !createData.project) {
        toast(createData.error || "Failed to create project", "error");
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
        toast(genData.error || "Generate failed", "error");
        await load();
        return;
      }

      setActiveProject(genData.project);
      setStep("result");
      setApiKey(""); // clear key from memory/UI
      toast("App generated and published", "success");
      await load();
    } catch {
      toast("Build failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(id: string, name: string) {
    if (!window.confirm(`Delete app “${name}”?`)) return;
    const res = await fetch(`/api/admin/app-builder/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Delete failed", "error");
      return;
    }
    toast("App deleted", "success");
    if (activeProject?.id === id) {
      setActiveProject(null);
      setStep("prompt");
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading App Builder…
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
              One prompt → interview → connect your LLM (Grok / Groq / custom) → deploy a full
              extension app (start with <strong>ecom-local-shop</strong>).
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
          {/* Step indicator */}
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {(
              [
                ["prompt", "1. Prompt"],
                ["questions", "2. Questions"],
                ["llm", "3. Your LLM"],
                ["result", "4. Live app"],
              ] as const
            ).map(([id, label]) => (
              <span
                key={id}
                className={`rounded-full px-3 py-1 ${
                  step === id ? "bg-accent-teal text-white" : "bg-muted text-text-secondary"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          {step === "prompt" && (
            <Card className="space-y-5 p-5 md:p-6">
              <h2 className="text-lg font-semibold">What do you want to build?</h2>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  One product prompt
                </span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. A local handicraft shop in Jaipur that sells pottery and textiles online with pickup option"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                />
              </label>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Extension (deployed app shape)
                </legend>
                {extensions.map((ext) => (
                  <label
                    key={ext.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                      extensionId === ext.id
                        ? "border-accent-teal bg-accent-teal/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ext"
                      checked={extensionId === ext.id}
                      onChange={() => setExtensionId(ext.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{ext.label}</span>
                      <span className="mt-1 block font-mono text-[11px] text-accent-teal">
                        {ext.id}
                      </span>
                      <span className="mt-1 block text-xs text-text-secondary">{ext.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <Button
                type="button"
                disabled={!prompt.trim()}
                onClick={() => setStep("questions")}
              >
                Continue to questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          )}

          {step === "questions" && extension && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Required questions</h2>
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:text-foreground"
                  onClick={() => setStep("prompt")}
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                Answer these so we can generate a complete <code className="text-xs">{extension.id}</code>{" "}
                app from your prompt.
              </p>
              <div className="space-y-4">
                {extension.questions.map((q) => (
                  <label key={q.id} className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-text-secondary">
                      {q.label}
                      {q.required ? " *" : ""}
                    </span>
                    {q.multiline ? (
                      <textarea
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        rows={3}
                        placeholder={q.placeholder}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                      />
                    ) : (
                      <input
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                      />
                    )}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => {
                  const err = validateQuestions();
                  if (err) {
                    toast(err, "error");
                    return;
                  }
                  setStep("llm");
                }}
              >
                Continue to LLM connection
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          )}

          {step === "llm" && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-accent-teal" />
                  <h2 className="text-lg font-semibold">Connect your LLM</h2>
                </div>
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:text-foreground"
                  onClick={() => setStep("questions")}
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                Use <strong>your</strong> API key. Keys are used only for this generate request and
                are <strong>not stored</strong> on Verlin Labs servers.
              </p>

              <fieldset className="grid gap-2 sm:grid-cols-3">
                {llmProviders.map((p) => (
                  <label
                    key={p.id}
                    className={`cursor-pointer rounded-xl border p-3 text-sm ${
                      provider === p.id ? "border-accent-teal bg-accent-teal/5" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={provider === p.id}
                      onChange={() => selectProvider(p.id)}
                    />
                    <span className="font-semibold">{p.label}</span>
                    <span className="mt-1 block text-xs text-text-secondary">{p.hint}</span>
                  </label>
                ))}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-text-secondary">API key *</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider === "xai"
                        ? "xai-..."
                        : provider === "groq"
                          ? "gsk_..."
                          : "sk-..."
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-text-secondary">Model</span>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                  />
                </label>
                {provider === "custom" ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-text-secondary">
                      Base URL (OpenAI-compatible)
                    </span>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm"
                    />
                  </label>
                ) : (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-text-secondary">Endpoint</span>
                    <input
                      value={baseUrl}
                      readOnly
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-sm"
                    />
                  </label>
                )}
              </div>

              <Button type="button" onClick={() => void handleBuild()} loading={busy} disabled={busy}>
                <Rocket className="mr-1.5 h-4 w-4" />
                {busy ? "Generating & deploying…" : "Generate & deploy app"}
              </Button>
            </Card>
          )}

          {step === "result" && activeProject && (
            <Card className="space-y-4 border-accent-teal/30 p-5 md:p-6">
              <div className="flex items-center gap-2 text-teal">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-foreground">App is live</h2>
              </div>
              <p className="text-sm text-text-secondary">
                <strong>{activeProject.name}</strong> · extension{" "}
                <code className="text-xs">{activeProject.extensionId}</code>
                {activeProject.generatedBy ? (
                  <> · generated via {activeProject.generatedBy}</>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={activeProject.publicPath} target="_blank">
                  <Button>
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Open {activeProject.publicPath}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setStep("prompt");
                    setActiveProject(null);
                    setPrompt("");
                    setAnswers({});
                  }}
                >
                  Build another
                </Button>
              </div>
            </Card>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your apps</h2>
            {projects.length === 0 ? (
              <Card className="p-6 text-center text-sm text-text-secondary">
                No apps yet. Start with a prompt above.
              </Card>
            ) : (
              projects.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-text-muted">
                      {p.extensionId} · {p.status} · {p.publicPath}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {p.status === "live" ? (
                      <Link href={p.publicPath} target="_blank">
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Open
                        </Button>
                      </Link>
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
