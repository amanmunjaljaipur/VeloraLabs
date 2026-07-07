"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { TRAINING_CATEGORIES, type TrainingEntry } from "@/lib/chat/training-types";
import {
  Bot,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DatasetResponse {
  entries: TrainingEntry[];
  categories: string[];
  lastTrainedAt: string | null;
  updatedAt: string;
  stats: { total: number; enabled: number };
  live?: {
    ready: boolean;
    entryCount: number;
    builtAt: string | null;
    model: string | null;
  };
}

const emptyForm = {
  category: "General",
  question: "",
  alternateQuestions: "",
  answer: "",
  bullets: "",
  keywords: "",
  linkLabel: "",
  linkUrl: "",
  enabled: true,
};

function splitLines(value: string): string[] {
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ChatbotTrainingPanel() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [importing, setImporting] = useState(false);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [lastTrainedAt, setLastTrainedAt] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<DatasetResponse["live"]>(undefined);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<{
    answer: string;
    confidence: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/chatbot/training");
    if (!res.ok) {
      toast("Failed to load training data", "error");
      return;
    }
    const data = (await res.json()) as DatasetResponse;
    setEntries(data.entries);
    setLastTrainedAt(data.lastTrainedAt ?? data.live?.builtAt ?? null);
    setLiveStatus(data.live);
  }, [toast]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const categories = useMemo(() => {
    const fromData = [...new Set(entries.map((e) => e.category))];
    return ["all", ...TRAINING_CATEGORIES.filter((c) => fromData.includes(c) || true)];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.question.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.alternateQuestions.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [entries, search, categoryFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(entry: TrainingEntry) {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      question: entry.question,
      alternateQuestions: entry.alternateQuestions.join(" | "),
      answer: entry.answer,
      bullets: entry.bullets.join(" | "),
      keywords: entry.keywords.join(" | "),
      linkLabel: entry.links[0]?.label ?? "",
      linkUrl: entry.links[0]?.href ?? "",
      enabled: entry.enabled,
    });
    setShowForm(true);
  }

  async function saveEntry() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast("Question and answer are required", "warning");
      return;
    }

    setSaving(true);
    const payload = {
      category: form.category,
      question: form.question,
      alternateQuestions: splitLines(form.alternateQuestions),
      answer: form.answer,
      bullets: splitLines(form.bullets),
      keywords: splitLines(form.keywords),
      links:
        form.linkLabel && form.linkUrl
          ? [{ label: form.linkLabel, href: form.linkUrl }]
          : [],
      enabled: form.enabled,
    };

    const url = editingId
      ? `/api/admin/chatbot/training/${editingId}`
      : "/api/admin/chatbot/training";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast(err.error ?? "Save failed", "error");
      return;
    }

    toast(editingId ? "Entry updated" : "Entry added", "success");
    setShowForm(false);
    await fetchData();
  }

  async function removeEntry(id: string) {
    if (!confirm("Delete this training entry?")) return;
    const res = await fetch(`/api/admin/chatbot/training/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Delete failed", "error");
      return;
    }
    toast("Entry deleted", "success");
    await fetchData();
  }

  async function handleImport(file: File) {
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", importMode);

    const res = await fetch("/api/admin/chatbot/training/import", {
      method: "POST",
      body: fd,
    });
    setImporting(false);

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast(err.error ?? "Import failed", "error");
      return;
    }

    const data = (await res.json()) as { imported: number; total: number };
    toast(`Imported ${data.imported} rows (${data.total} total)`, "success");
    await fetchData();
  }

  async function retrain() {
    setRetraining(true);
    const res = await fetch("/api/admin/chatbot/retrain", { method: "POST" });
    setRetraining(false);

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast(err.error ?? "Retrain failed", "error");
      return;
    }

    const data = (await res.json()) as { entries: number; builtAt: string };
    toast(`Retrained ${data.entries} entries`, "success");
    setLastTrainedAt(data.builtAt);
    setLiveStatus({
      ready: true,
      entryCount: data.entries,
      builtAt: data.builtAt,
      model: null,
    });
    await fetchData();
  }

  async function runTest() {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/chatbot/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testQuery }),
    });
    setTesting(false);
    if (!res.ok) {
      toast("Test failed", "error");
      return;
    }
    const data = (await res.json()) as { answer: string; confidence: number };
    setTestResult(data);
  }

  function downloadExport(template = false) {
    const url = template
      ? "/api/admin/chatbot/training/export?template=1"
      : "/api/admin/chatbot/training/export";
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
      </div>
    );
  }

  return (
    <div className="container-verlin space-y-8 pb-16 pt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Labeled entries</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{entries.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Enabled for chat</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {entries.filter((e) => e.enabled).length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Live on site</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {liveStatus?.ready ? (
              <span className="text-emerald-700 dark:text-emerald-300">
                {liveStatus.entryCount} answers active
              </span>
            ) : (
              "No index loaded"
            )}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Index built</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {lastTrainedAt
              ? new Date(lastTrainedAt).toLocaleString()
              : "Run Retrain after edits"}
          </p>
        </Card>
      </div>

      <Card className="p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Bot className="h-5 w-5 text-accent-teal" />
              Training actions
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              The site chatbot serves the built index ({liveStatus?.ready ? `${liveStatus.entryCount} live answers` : "retrain required"}).
              Retrain after adding or editing entries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadExport(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Template
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadExport(false)}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button size="sm" variant="cta" onClick={retrain} loading={retraining}>
              <RefreshCw className="h-4 w-4" />
              Retrain
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Import from Excel</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Columns: Category, Question, Answer, Alternate Questions (| separated), Keywords, Bullets, Link Label, Link URL, Enabled
            </p>
          </div>
          <Select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as "merge" | "replace")}
            options={[
              { value: "merge", label: "Merge with existing" },
              { value: "replace", label: "Replace all" },
            ]}
            className="w-full sm:w-48"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            loading={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Excel
          </Button>
        </div>
      </Card>

      {showForm && (
        <Card className="space-y-4 p-5 md:p-6">
          <h3 className="text-lg font-semibold text-foreground">
            {editingId ? "Edit training entry" : "New training entry"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Category (label)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              options={TRAINING_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="rounded border-border"
              />
              Enabled in chatbot
            </label>
          </div>
          <Input
            label="Primary question"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            placeholder="What are the course prices?"
          />
          <Input
            label="Alternate questions (| separated)"
            value={form.alternateQuestions}
            onChange={(e) => setForm((f) => ({ ...f, alternateQuestions: e.target.value }))}
            placeholder="pricing model | how much | course cost"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
              placeholder="Full answer the chatbot should return..."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Keywords (| separated)"
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            />
            <Input
              label="Bullets (| separated)"
              value={form.bullets}
              onChange={(e) => setForm((f) => ({ ...f, bullets: e.target.value }))}
            />
            <Input
              label="Link label"
              value={form.linkLabel}
              onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
            />
            <Input
              label="Link URL"
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveEntry} loading={saving}>
              {editingId ? "Save changes" : "Add entry"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5 md:p-6">
        <h3 className="text-lg font-semibold text-foreground">Test a question</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Preview what the chatbot returns before retraining.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="e.g. What is the introductory pricing offer?"
            className="flex-1"
          />
          <Button onClick={runTest} loading={testing} variant="secondary">
            <Play className="h-4 w-4" />
            Test
          </Button>
        </div>
        {testResult && (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Confidence: {Math.round(testResult.confidence * 100)}%
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{testResult.answer}</p>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, answers, categories..."
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categories.map((c) => ({
              value: c,
              label: c === "all" ? "All categories" : c,
            }))}
            className="w-full sm:w-44"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Alternates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Badge className="border-border bg-card text-foreground">{entry.category}</Badge>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium text-foreground">{entry.question}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{entry.answer}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {entry.alternateQuestions.length || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        entry.enabled
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border bg-muted text-text-secondary"
                      }
                    >
                      {entry.enabled ? "On" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="rounded-lg p-2 text-text-secondary hover:bg-muted hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="rounded-lg p-2 text-text-secondary hover:bg-red-500/10 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-text-secondary">No entries match your filter.</p>
          )}
        </div>
      </Card>
    </div>
  );
}