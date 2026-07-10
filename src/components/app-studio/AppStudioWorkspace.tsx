"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createBaseScaffold, listFilePaths } from "@/lib/app-studio/scaffold";
import type {
  StudioChatMessage,
  StudioFileMap,
  StudioResearchPack,
  StudioVersion,
} from "@/lib/app-studio/types";
import { cn } from "@/lib/utils";
import {
  SandpackPreview,
  SandpackProvider,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import Editor from "@monaco-editor/react";
import JSZip from "jszip";
import {
  Code2,
  Download,
  History,
  ImagePlus,
  Loader2,
  MonitorPlay,
  Rocket,
  Send,
  Sparkles,
  Undo2,
  Redo2,
  FileCode2,
  GitBranch,
  UploadCloud,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

const EXAMPLE_PROMPTS = [
  "A task board like Trello with drag-free columns and add-card form",
  "A personal finance dashboard with expense categories and charts (CSS only)",
  "A booking page for a yoga studio with class list and booking modal",
  "A SaaS landing page + pricing + waitlist form for an AI writing tool",
];

type CanvasTab = "preview" | "code";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sandpackFiles(files: StudioFileMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, code] of Object.entries(files)) {
    // Sandpack paths without leading slash for some templates; keep both styles safe
    const key = path.startsWith("/") ? path.slice(1) : path;
    out[`/${key.replace(/^\//, "")}`] = code;
  }
  // Ensure package.json present
  if (!out["/package.json"] && files["/package.json"]) {
    out["/package.json"] = files["/package.json"];
  }
  return files;
}

export function AppStudioWorkspace() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<StudioChatMessage[]>([]);
  const [files, setFiles] = useState<StudioFileMap>(() => createBaseScaffold());
  const [activeFile, setActiveFile] = useState("/src/App.tsx");
  const [canvasTab, setCanvasTab] = useState<CanvasTab>("preview");
  const [versions, setVersions] = useState<StudioVersion[]>([]);
  const [versionIndex, setVersionIndex] = useState(-1);
  const [research, setResearch] = useState<StudioResearchPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState(38);
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null);

  const paths = useMemo(() => listFilePaths(files), [files]);

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
    const userMsg: StudioChatMessage = {
      id: uid(),
      role: "user",
      content: userText.trim(),
      imageDataUrl: imageDataUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setPrompt("");

    try {
      setPhase("Researching workflows & market…");
      const isFirst = versions.length === 0;

      const res = await fetch("/api/app-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText.trim(),
          currentFiles: isFirst ? undefined : files,
          runResearch: isFirst || /research|workflow|competitor/i.test(userText),
          research: isFirst ? null : research,
          history: messages
            .filter((x) => x.role === "user" || x.role === "assistant")
            .slice(-8)
            .map((x) => ({ role: x.role as "user" | "assistant", content: x.content })),
          imageDataUrl: imageDataUrl || undefined,
        }),
      });

      setPhase("Generating application code…");
      const data = (await res.json()) as {
        files?: StudioFileMap;
        summary?: string;
        research?: StudioResearchPack;
        designedBy?: string;
        error?: string;
      };

      if (!res.ok || !data.files) {
        toast(data.error || "Generation failed", "error");
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: data.error || "Something went wrong. Try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      setFiles(data.files);
      if (data.research) setResearch(data.research);
      pushVersion(
        isFirst ? "Initial build" : userText.trim().slice(0, 60),
        data.files,
        userText.trim()
      );
      setActiveFile(
        data.files["/src/App.tsx"] ? "/src/App.tsx" : Object.keys(data.files)[0]
      );
      setCanvasTab("preview");
      setImageDataUrl(null);

      const researchNote = data.research
        ? `\n\n**Research**\n${data.research.summary}\nWorkflows: ${data.research.coreWorkflows.map((w) => w.name).join(", ")}`
        : "";

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: `${data.summary || "Updated your app."}${researchNote}\n\n_Designed by: ${data.designedBy || "llm"}_`,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast("App updated — preview refreshed", "success");
    } catch {
      toast("Network error during generation", "error");
    } finally {
      setBusy(false);
      setPhase(null);
    }
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

  const spFiles = sandpackFiles(files);

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
          <Button type="button" size="sm" variant="secondary" onClick={() => void downloadZip()}>
            <Download className="h-3.5 w-3.5" /> ZIP
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              toast("Connect GitHub OAuth in settings (coming next) — use ZIP for now.", "success")
            }
          >
            <GitBranch className="h-3.5 w-3.5" /> GitHub
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              toast("Deploy hooks for Vercel/Netlify ship next — export ZIP to deploy manually.", "success")
            }
          >
            <UploadCloud className="h-3.5 w-3.5" /> Deploy
          </Button>
        </div>
      </header>

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
                onClick={() => setCanvasTab("preview")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  canvasTab === "preview"
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <MonitorPlay className="h-3.5 w-3.5" /> Preview
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

          {canvasTab === "preview" ? (
            <div className="flex min-h-0 flex-1 flex-col bg-slate-100 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                localhost:preview · Sandpack Vite
              </div>
              <div className="min-h-0 flex-1">
                <SandpackProvider
                  template="vite-react-ts"
                  theme="light"
                  files={spFiles}
                  options={{
                    externalResources: ["https://cdn.tailwindcss.com"],
                    recompileMode: "immediate",
                    recompileDelay: 400,
                  }}
                  customSetup={{
                    dependencies: {
                      "lucide-react": "latest",
                      clsx: "latest",
                    },
                  }}
                >
                  <SandpackLayout style={{ height: "100%", border: "none" }}>
                    <SandpackPreview
                      showOpenInCodeSandbox={false}
                      showRefreshButton
                      style={{ height: "100%" }}
                    />
                  </SandpackLayout>
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
        </section>
      </div>
    </div>
  );
}
