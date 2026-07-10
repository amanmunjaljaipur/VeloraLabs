"use client";

import { StudioAppFullscreen } from "@/components/app-studio/StudioAppFullscreen";
import { StudioVerlinPreview } from "@/components/app-studio/StudioVerlinPreview";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { GenericAppContent } from "@/lib/app-builder/types";
import { createBaseScaffold, listFilePaths } from "@/lib/app-studio/scaffold";
import { toSandpackReactTsFiles } from "@/lib/app-studio/parse-files";
import { researchToVerlinContent } from "@/lib/app-studio/to-verlin-content";
import type {
  StudioChatMessage,
  StudioFileMap,
  StudioResearchPack,
  StudioVersion,
} from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import Editor from "@monaco-editor/react";
import JSZip from "jszip";
import {
  Code2,
  Copy,
  Download,
  ExternalLink,
  History,
  ImagePlus,
  Loader2,
  Maximize2,
  MonitorPlay,
  Rocket,
  Send,
  Sparkles,
  Undo2,
  Redo2,
  FileCode2,
  LayoutTemplate,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_PROMPTS = [
  "A task board like Trello with drag-free columns and add-card form",
  "A personal finance dashboard with expense categories and charts (CSS only)",
  "A booking page for a yoga studio with class list and booking modal",
  "A SaaS landing page + pricing + waitlist form for an AI writing tool",
];

type CanvasTab = "verlin" | "sandbox" | "code";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}



export function AppStudioWorkspace() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<StudioChatMessage[]>([]);
  const [files, setFiles] = useState<StudioFileMap>(() => createBaseScaffold());
  const [activeFile, setActiveFile] = useState("/src/App.tsx");
  const [canvasTab, setCanvasTab] = useState<CanvasTab>("verlin");
  const [versions, setVersions] = useState<StudioVersion[]>([]);
  const [versionIndex, setVersionIndex] = useState(-1);
  const [research, setResearch] = useState<StudioResearchPack | null>(null);
  const [verlinContent, setVerlinContent] = useState<GenericAppContent | null>(null);
  const [published, setPublished] = useState<{
    slug: string;
    publicPath: string;
    absoluteUrl: string;
    name: string;
  } | null>(null);
  const [myApps, setMyApps] = useState<
    Array<{ id: string; slug: string; name: string; publicPath: string; status: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState(38);
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null);
  /** Session-only — never sent to disk */
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "groq" | "xai" | "anthropic" | "openai">(
    "groq"
  );
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const lastPromptRef = useRef("");

  const paths = useMemo(() => listFilePaths(files), [files]);
  const spFiles = useMemo(() => toSandpackReactTsFiles(files), [files]);

  const aiAuth = useCallback(
    () => ({
      apiKey: aiKey.trim() || undefined,
      provider: aiKey.trim() ? aiProvider : undefined,
      model: aiKey.trim() && aiModel.trim() ? aiModel.trim() : undefined,
    }),
    [aiKey, aiProvider, aiModel]
  );

  const loadMyApps = useCallback(async () => {
    try {
      const res = await fetch("/api/app-studio/projects");
      if (!res.ok) return;
      const data = (await res.json()) as {
        projects?: Array<{
          id: string;
          slug: string;
          name: string;
          publicPath: string;
          status: string;
        }>;
      };
      setMyApps(data.projects || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadMyApps();
  }, [loadMyApps]);

  const pushVersion = useCallback(
    (label: string, nextFiles: StudioFileMap, userPrompt: string) => {
      const v: StudioVersion = {
        id: uid(),
        label,
        prompt: userPrompt,
        files: nextFiles,
        createdAt: new Date().toISOString(),
      };
      setVersions((prev) => {
        const trimmed = versionIndex >= 0 ? prev.slice(0, versionIndex + 1) : prev;
        const next = [...trimmed, v].slice(-30);
        setVersionIndex(next.length - 1);
        return next;
      });
    },
    [versionIndex]
  );

  function restoreVersion(index: number) {
    const v = versions[index];
    if (!v) return;
    setFiles(v.files);
    setVersionIndex(index);
    setActiveFile(
      v.files["/src/App.tsx"] ? "/src/App.tsx" : Object.keys(v.files)[0] || "/src/App.tsx"
    );
    toast(`Restored: ${v.label}`, "success");
  }

  function undo() {
    if (versionIndex > 0) restoreVersion(versionIndex - 1);
  }
  function redo() {
    if (versionIndex < versions.length - 1) restoreVersion(versionIndex + 1);
  }

  async function runGenerate(userText: string) {
    if (!userText.trim()) {
      toast("Describe what to build", "error");
      return;
    }
    setBusy(true);
    lastPromptRef.current = userText.trim();
    const userMsg: StudioChatMessage = {
      id: uid(),
      role: "user",
      content: userText.trim(),
      imageDataUrl: imageDataUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setPrompt("");
    setPublished(null);

    try {
      // 1) Research first (always for first build / new idea)
      setPhase("Researching product, workflows & competitors…");
      const isFirst = !research || versions.length === 0;
      let nextResearch = research;

      if (isFirst || /research|workflow|competitor|rebuild/i.test(userText)) {
        const rRes = await fetch("/api/app-studio/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userText.trim(), ...aiAuth() }),
        });
        const rData = (await rRes.json()) as {
          research?: StudioResearchPack;
          error?: string;
        };
        if (rData.research) {
          nextResearch = rData.research;
          setResearch(rData.research);
        }
      }

      // 2) Generate code files (sandbox / export)
      setPhase("Building application with research insights…");
      const res = await fetch("/api/app-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText.trim(),
          currentFiles: isFirst ? undefined : files,
          runResearch: false,
          research: nextResearch,
          history: messages
            .filter((x) => x.role === "user" || x.role === "assistant")
            .slice(-6)
            .map((x) => ({ role: x.role as "user" | "assistant", content: x.content })),
          imageDataUrl: imageDataUrl || undefined,
          ...aiAuth(),
        }),
      });

      const data = (await res.json()) as {
        files?: StudioFileMap;
        summary?: string;
        research?: StudioResearchPack;
        designedBy?: string;
        error?: string;
        code?: string;
        hint?: string;
        warning?: string;
        content?: GenericAppContent;
      };

      if (data.research) {
        nextResearch = data.research;
        setResearch(data.research);
      }

      // 3) Map research → Verlin UI content (same components as live /apps)
      setPhase("Composing Verlin Labs pages…");
      if (nextResearch) {
        const content = researchToVerlinContent({
          prompt: userText.trim(),
          research: nextResearch,
        });
        setVerlinContent(content);
      }

      if (data.files && Object.keys(data.files).length) {
        setFiles(data.files);
        setPreviewKey((k) => k + 1);
        pushVersion(
          isFirst ? "Initial build" : userText.trim().slice(0, 60),
          data.files,
          userText.trim()
        );
        setActiveFile(
          data.files["/src/App.tsx"]
            ? "/src/App.tsx"
            : data.files["/App.tsx"]
              ? "/App.tsx"
              : Object.keys(data.files)[0]
        );
      }

      if (!res.ok && !nextResearch) {
        const msg = data.error || "Build failed";
        toast(msg.slice(0, 160), "error");
        if (data.code === "credits" || data.code === "no_key" || data.code === "auth") {
          setShowKeyPanel(true);
        }
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: `${msg}\n\nFix AI key if needed, then Build again.`,
            createdAt: new Date().toISOString(),
          },
        ]);
        setCanvasTab("verlin");
        return;
      }

      setCanvasTab("verlin");
      setImageDataUrl(null);

      const brand = verlinContent?.brandName;
      const researchNote = nextResearch
        ? `\n\n**Research**\n${nextResearch.summary}\n**Workflows:** ${(nextResearch.coreWorkflows || []).map((w) => w.name).join(", ")}\n**Screens:** ${(nextResearch.screens || []).join(", ")}`
        : "";

      const builtName =
        nextResearch
          ? researchToVerlinContent({ prompt: userText.trim(), research: nextResearch }).brandName
          : brand || "your app";

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: `Built **${builtName}** with Verlin UI pages (Button, Card, Badge).${researchNote}\n\n1. Review the **Verlin UI** tab\n2. Click **Publish** for a live share link at \`/apps/…\`\n\n_AI code: ${data.designedBy || "studio"}_`,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast("App ready — click See full app for the complete screen", "success");
      // Open full product screen so the user sees the whole app immediately
      setFullScreen(true);
    } catch {
      toast("Network error during generation", "error");
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  async function publishLive() {
    const p = lastPromptRef.current || prompt.trim();
    if (!p && !research) {
      toast("Build an app first, then publish", "error");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/app-studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: p || research?.summary || "Studio app",
          research,
          studioFiles: files,
          status: "live",
          slug: published?.slug,
          projectId: undefined,
          ...aiAuth(),
        }),
      });
      const data = (await res.json()) as {
        project?: { id: string; slug: string; name: string; publicPath: string };
        absoluteUrl?: string;
        publicUrl?: string;
        content?: GenericAppContent;
        error?: string;
      };
      if (!res.ok || !data.project) {
        toast(data.error || "Publish failed", "error");
        return;
      }
      if (data.content) setVerlinContent(data.content);
      const absolute =
        data.absoluteUrl ||
        `${window.location.origin}${data.publicUrl || data.project.publicPath}`;
      setPublished({
        slug: data.project.slug,
        publicPath: data.project.publicPath,
        absoluteUrl: absolute,
        name: data.project.name,
      });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: `**Published:** [${data.project!.name}](${absolute})\n\nLive link: ${absolute}\n\nAnyone with the link can open the app (Verlin UI).`,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast("Published — link ready to share", "success");
      void loadMyApps();
    } catch {
      toast("Publish failed", "error");
    } finally {
      setPublishing(false);
    }
  }

  function copyLink() {
    if (!published?.absoluteUrl) return;
    void navigator.clipboard.writeText(published.absoluteUrl);
    toast("Link copied", "success");
  }

  function onPickImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast("Please upload an image", "error");
      return;
    }
    if (file.size > 4_000_000) {
      toast("Image must be under 4MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function downloadZip() {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path.replace(/^\//, ""), content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-studio-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Download started", "success");
  }

  function onSplitterDown(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startPct: splitPct };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const w = window.innerWidth || 1200;
      const next = Math.min(55, Math.max(28, dragRef.current.startPct + (dx / w) * 100));
      setSplitPct(next);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white dark:bg-accent-teal dark:text-navy">
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">App Studio</p>
            <p className="text-[10px] text-muted-foreground">
              Prompt → research workflows → live code preview
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" size="sm" variant="secondary" onClick={undo} disabled={versionIndex <= 0}>
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={redo}
            disabled={versionIndex >= versions.length - 1}
          >
            <Redo2 className="h-3.5 w-3.5" /> Redo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowKeyPanel((v) => !v)}
          >
            AI key
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void downloadZip()}>
            <Download className="h-3.5 w-3.5" /> ZIP
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!verlinContent}
            onClick={() => {
              if (!verlinContent) {
                toast("Build an app first to open the full screen", "error");
                return;
              }
              setFullScreen(true);
            }}
          >
            <Maximize2 className="h-3.5 w-3.5" /> See full app
          </Button>
          <Button
            type="button"
            size="sm"
            variant="cta"
            loading={publishing}
            disabled={!research && !verlinContent}
            onClick={() => void publishLive()}
          >
            <UploadCloud className="h-3.5 w-3.5" /> Publish
          </Button>
        </div>
      </header>

      {published && (
        <div className="flex flex-wrap items-center gap-2 border-b border-accent-teal/30 bg-accent-teal/5 px-3 py-2 text-sm">
          <span className="font-medium text-foreground">Live:</span>
          <Link
            href={published.publicPath}
            target="_blank"
            className="inline-flex items-center gap-1 font-medium text-accent-teal hover:underline"
          >
            {published.absoluteUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" /> Copy link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="cta"
            onClick={() => window.open(published.publicPath, "_blank")}
          >
            <Maximize2 className="h-3.5 w-3.5" /> Open full app
          </Button>
        </div>
      )}

      {showKeyPanel && (
        <div className="border-b border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs space-y-2">
          <p className="font-medium text-foreground">
            Platform xAI often fails with “no credits / licenses”. Paste a working key for this browser
            session only (never saved to the server).
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Provider</span>
              <select
                value={aiProvider}
                onChange={(e) =>
                  setAiProvider(
                    e.target.value as "gemini" | "groq" | "xai" | "anthropic" | "openai"
                  )
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5"
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI</option>
                <option value="xai">xAI Grok</option>
              </select>
            </label>
            <label className="flex min-w-[14rem] flex-1 flex-col gap-0.5">
              <span className="text-muted-foreground">API key</span>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="Paste key — not stored"
                className="rounded-lg border border-border bg-background px-2 py-1.5 font-mono"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Model (optional)</span>
              <input
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder={
                  aiProvider === "gemini"
                    ? "gemini-2.0-flash"
                    : aiProvider === "groq"
                      ? "llama-3.3-70b-versatile"
                      : aiProvider === "xai"
                        ? "grok-3-mini"
                        : "default"
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5 w-44"
              />
            </label>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowKeyPanel(false)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left: chat */}
        <aside
          className="flex min-h-0 flex-col border-r border-border"
          style={{ width: `${splitPct}%` }}
        >
          <div className="flex items-center gap-1.5 border-b border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Copilot
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What do you want to build?</p>
                <p className="mt-1 text-xs">
                  I research workflows, then generate a full React app with live preview. Iterate in chat.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-left text-[11px] hover:border-accent-teal/50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[95%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  msg.role === "user" &&
                    "ml-auto bg-navy text-white dark:bg-accent-teal dark:text-navy",
                  msg.role === "assistant" && "bg-muted/70 text-foreground",
                  msg.role === "system" && "mx-auto text-center text-xs text-muted-foreground"
                )}
              >
                {msg.imageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.imageDataUrl}
                    alt="Reference"
                    className="mb-2 max-h-28 rounded-lg border border-white/20"
                  />
                )}
                {msg.content}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {phase || "Working…"}
              </div>
            )}

            {research && !busy && (
              <div className="rounded-xl border border-accent-teal/30 bg-accent-teal/5 p-3 text-xs">
                <p className="font-semibold text-accent-teal">Research pack</p>
                <p className="mt-1 text-muted-foreground">{research.summary}</p>
                {research.coreWorkflows[0] && (
                  <p className="mt-2">
                    <span className="font-medium">Workflow:</span>{" "}
                    {research.coreWorkflows[0].steps.join(" → ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3 space-y-2">
            {imageDataUrl && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="" className="h-10 w-10 rounded object-cover" />
                Image attached (vision-to-code hint)
                <button type="button" className="underline" onClick={() => setImageDataUrl(null)}>
                  remove
                </button>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe the app, or ask for a change…"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent-teal"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void runGenerate(prompt);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickImage(f);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Image
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="cta"
                loading={busy}
                disabled={!prompt.trim()}
                onClick={() => void runGenerate(prompt)}
              >
                <Send className="h-3.5 w-3.5" />
                {versions.length ? "Update" : "Build"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter to send</p>
          </div>
        </aside>

        {/* Splitter */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={onSplitterDown}
          className="w-1.5 cursor-col-resize bg-border hover:bg-accent-teal/50"
        />

        {/* Right: canvas */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCanvasTab("verlin")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  canvasTab === "verlin"
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Verlin UI
              </button>
              <button
                type="button"
                onClick={() => setCanvasTab("sandbox")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  canvasTab === "sandbox"
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <MonitorPlay className="h-3.5 w-3.5" /> Sandbox
              </button>
              <button
                type="button"
                onClick={() => setCanvasTab("code")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  canvasTab === "code"
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Code2 className="h-3.5 w-3.5" /> Code
              </button>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <History className="h-3 w-3" />
              {versions.length
                ? `v${versionIndex + 1}/${versions.length}`
                : "No commits yet"}
            </div>
          </div>

          {canvasTab === "verlin" ? (
            <div className="min-h-0 flex-1 overflow-hidden bg-muted/20 p-2">
              {verlinContent ? (
                <div className="relative h-full min-h-[480px]">
                  <div className="absolute right-3 top-3 z-10">
                    <Button type="button" size="sm" variant="cta" onClick={() => setFullScreen(true)}>
                      <Maximize2 className="h-3.5 w-3.5" />
                      See full app
                    </Button>
                  </div>
                  <StudioVerlinPreview content={verlinContent} />
                </div>
              ) : (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  <LayoutTemplate className="mb-3 h-10 w-10 opacity-40" />
                  <p className="font-medium text-foreground">Full product screen</p>
                  <p className="mt-1 max-w-sm">
                    After you Build, use <strong>See full app</strong> for a complete full-screen
                    experience. Publish for a public link at /apps/…
                  </p>
                </div>
              )}
            </div>
          ) : canvasTab === "sandbox" ? (
            <div className="flex min-h-0 flex-1 flex-col bg-slate-100 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Code sandbox preview
              </div>
              <div className="min-h-0 flex-1" style={{ minHeight: 420 }}>
                <SandpackProvider
                  key={`sp-${previewKey}`}
                  template="react-ts"
                  theme="light"
                  files={spFiles}
                  options={{
                    externalResources: ["https://cdn.tailwindcss.com"],
                    recompileMode: "delayed",
                    recompileDelay: 500,
                    autorun: true,
                    autoReload: true,
                  }}
                  customSetup={{
                    dependencies: {
                      "lucide-react": "^0.454.0",
                      clsx: "^2.1.1",
                    },
                  }}
                  style={{ height: "100%" }}
                >
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                    showNavigator={false}
                    style={{ height: "100%", minHeight: 420, border: "none" }}
                  />
                </SandpackProvider>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              <div className="w-44 shrink-0 overflow-y-auto border-r border-border bg-muted/20 text-xs">
                {paths.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveFile(p)}
                    className={cn(
                      "flex w-full items-center gap-1 truncate px-2 py-1.5 text-left hover:bg-muted",
                      activeFile === p && "bg-accent-teal/10 text-accent-teal font-medium"
                    )}
                  >
                    <FileCode2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.replace(/^\//, "")}</span>
                  </button>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  path={activeFile}
                  language={
                    activeFile.endsWith(".tsx") || activeFile.endsWith(".ts")
                      ? "typescript"
                      : activeFile.endsWith(".css")
                        ? "css"
                        : activeFile.endsWith(".json")
                          ? "json"
                          : activeFile.endsWith(".html")
                            ? "html"
                            : "plaintext"
                  }
                  value={files[activeFile] || ""}
                  onChange={(v) => {
                    if (v === undefined) return;
                    setFiles((prev) => ({ ...prev, [activeFile]: v }));
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>
          )}

          {/* Version timeline */}
          {versions.length > 0 && (
            <div className="max-h-24 overflow-x-auto border-t border-border bg-card/50 px-2 py-1.5">
              <div className="flex gap-1.5">
                {versions.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => restoreVersion(i)}
                    className={cn(
                      "shrink-0 rounded-lg border px-2 py-1 text-[10px] max-w-[9rem] truncate",
                      i === versionIndex
                        ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                    title={v.prompt}
                  >
                    {i + 1}. {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {myApps.length > 0 && (
            <div className="border-t border-border bg-card/80 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Your published apps
              </p>
              <div className="flex flex-wrap gap-2">
                {myApps.slice(0, 8).map((a) => (
                  <Link
                    key={a.id}
                    href={a.publicPath}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:border-accent-teal/50"
                  >
                    {a.name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <StudioAppFullscreen
        open={fullScreen}
        onClose={() => setFullScreen(false)}
        content={verlinContent}
        publishedPath={published?.publicPath}
        publishedUrl={published?.absoluteUrl}
      />
    </div>
  );
}
