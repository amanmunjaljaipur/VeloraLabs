"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatLegalDate } from "@/lib/legal/render";
import type { LegalCmsData, LegalDocType, LegalDocument, LegalSection } from "@/lib/legal/types";
import { FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DOC_TABS: { type: LegalDocType; label: string }[] = [
  { type: "terms", label: "Terms of Service" },
  { type: "privacy", label: "Privacy Policy" },
  { type: "refund", label: "Refund Policy" },
];

function emptySection(): LegalSection {
  return {
    id: `section-${Date.now()}`,
    heading: "New section",
    content: "",
  };
}

export function LegalCmsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeType, setActiveType] = useState<LegalDocType>("terms");
  const [cms, setCms] = useState<LegalCmsData | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [sections, setSections] = useState<LegalSection[]>([]);

  const loadDoc = useCallback((data: LegalCmsData, type: LegalDocType) => {
    const doc = data[type];
    setDisclaimer(doc.disclaimer);
    setSections(doc.sections.map((s) => ({ ...s })));
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/legal");
    if (!res.ok) {
      toast("Failed to load legal documents", "error");
      return;
    }
    const data = (await res.json()) as LegalCmsData;
    setCms(data);
    loadDoc(data, "terms");
    setActiveType("terms");
  }, [loadDoc, toast]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  function switchTab(type: LegalDocType) {
    if (!cms) return;
    setActiveType(type);
    loadDoc(cms, type);
  }

  function updateSection(index: number, patch: Partial<LegalSection>) {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, ...patch } : section))
    );
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (sections.some((s) => !s.heading.trim() || !s.content.trim())) {
      toast("Every section needs a heading and content", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/legal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeType,
        disclaimer,
        sections,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      toast(payload.error || "Save failed", "error");
      return;
    }

    const payload = (await res.json()) as { document: LegalDocument };
    setCms((prev) => (prev ? { ...prev, [activeType]: payload.document } : prev));
    toast(
      `${DOC_TABS.find((t) => t.type === activeType)?.label} saved — now v${payload.document.version}`,
      "success"
    );
  }

  const activeDoc = cms?.[activeType];

  if (loading) {
    return (
      <div className="container-verlin flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading legal documents…
      </div>
    );
  }

  return (
    <div className="container-verlin space-y-6 pb-16">
      <div className="flex flex-wrap gap-2">
        {DOC_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => switchTab(tab.type)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeType === tab.type
                ? "bg-accent-teal text-white"
                : "bg-muted text-text-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeDoc && (
        <p className="text-sm text-text-secondary">
          <FileText className="mr-1.5 inline h-4 w-4" />
          Version {activeDoc.version} · Last updated {formatLegalDate(activeDoc.lastUpdated)}
          {activeDoc.updatedBy ? ` · by ${activeDoc.updatedBy}` : ""}
        </p>
      )}

      <Card className="space-y-4 p-6">
        <label className="block text-sm font-medium text-foreground">Disclaimer banner</label>
        <textarea
          rows={3}
          value={disclaimer}
          onChange={(e) => setDisclaimer(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
        />
      </Card>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.id} className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Section {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSection(index)}
                disabled={sections.length <= 1}
                className="rounded-lg p-2 text-text-secondary hover:bg-muted hover:text-red-500 disabled:opacity-40"
                aria-label="Remove section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Input
              label="Section ID"
              value={section.id}
              onChange={(e) => updateSection(index, { id: e.target.value })}
            />
            <Input
              label="Heading"
              value={section.heading}
              onChange={(e) => updateSection(index, { heading: e.target.value })}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Content</label>
              <textarea
                rows={6}
                value={section.content}
                onChange={(e) => updateSection(index, { content: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
              />
              <p className="text-xs text-text-secondary">
                Separate paragraphs with a blank line.
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setSections((prev) => [...prev, emptySection()])}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add section
        </Button>
        <Button onClick={handleSave} loading={saving}>
          <Save className="mr-1.5 h-4 w-4" />
          Save &amp; bump version
        </Button>
      </div>

      <p className="text-xs text-text-secondary">
        Saving increments the document version. Signed-in users who have not accepted the new
        version will be prompted on their next visit.
      </p>
    </div>
  );
}