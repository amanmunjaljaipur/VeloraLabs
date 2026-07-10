"use client";

import type { AppDataFieldSpec, AppDataModelSpec } from "@/lib/app-builder/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface AppDataRecordView {
  id: string;
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/** Generic CRUD admin dashboard for non-ecommerce Forge products.
 *  Renders one tab per data model from the build plan, with a table view,
 *  inline add/edit form driven by each field's type, and delete. */
export function GenericDataAdmin({
  slug,
  dataModels,
  accent,
  canManage,
  onBack,
}: {
  slug: string;
  dataModels: AppDataModelSpec[];
  accent: string;
  canManage: boolean;
  onBack: () => void;
}) {
  const models = useMemo(() => dataModels.filter((m) => m.fields?.length), [dataModels]);
  const [activeModelId, setActiveModelId] = useState<string>(models[0]?.id || "");
  const [records, setRecords] = useState<AppDataRecordView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AppDataRecordView | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const activeModel = models.find((m) => m.id === activeModelId) || null;

  const load = useCallback(async () => {
    if (!activeModelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${slug}/admin/data?modelId=${encodeURIComponent(activeModelId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load records");
      setRecords(data.records || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [slug, activeModelId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    if (!activeModel) return;
    const blank: Record<string, string> = {};
    for (const f of activeModel.fields) blank[f.name] = "";
    setForm(blank);
    setEditing("new");
  }

  function openEdit(record: AppDataRecordView) {
    if (!activeModel) return;
    const values: Record<string, string> = {};
    for (const f of activeModel.fields) {
      const v = record.fields[f.name];
      values[f.name] = v === undefined || v === null ? "" : String(v);
    }
    setForm(values);
    setEditing(record);
  }

  function coerceField(field: AppDataFieldSpec, raw: string): unknown {
    switch (field.type) {
      case "number":
      case "money":
        return raw.trim() === "" ? null : Number(raw);
      case "boolean":
        return raw === "true" || raw === "on" || raw === "yes";
      case "json":
        try {
          return raw.trim() ? JSON.parse(raw) : {};
        } catch {
          return raw;
        }
      default:
        return raw;
    }
  }

  async function save() {
    if (!activeModel) return;
    setSaving(true);
    setError(null);
    try {
      const fields: Record<string, unknown> = {};
      for (const f of activeModel.fields) {
        fields[f.name] = coerceField(f, form[f.name] ?? "");
      }
      if (editing === "new") {
        const res = await fetch(`/api/apps/${slug}/admin/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: activeModel.id, fields }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create record");
      } else if (editing) {
        const res = await fetch(`/api/apps/${slug}/admin/data`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: activeModel.id, recordId: editing.id, fields }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update record");
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(record: AppDataRecordView) {
    if (!activeModel) return;
    if (typeof window !== "undefined" && !window.confirm("Delete this record?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/apps/${slug}/admin/data`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: activeModel.id, recordId: record.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete record");
      setRecords((rows) => rows.filter((r) => r.id !== record.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!models.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">Dashboard for this product</p>
        <p className="mt-2 text-sm text-text-secondary">
          This product doesn&apos;t define any data models yet. Edit the plan in the builder to add
          one, then rebuild.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: accent }}
        >
          Back to app
        </button>
      </div>
    );
  }

  const displayFields = activeModel ? activeModel.fields.slice(0, 5) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage the records behind this product. Changes are live immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        >
          Back to app
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {models.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActiveModelId(m.id);
              setEditing(null);
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={
              activeModelId === m.id
                ? { background: accent, color: "#fff" }
                : { background: "transparent", color: "inherit" }
            }
          >
            {m.name}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {activeModel ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {activeModel.description || `${records.length} record${records.length === 1 ? "" : "s"}`}
            </p>
            {canManage ? (
              <button
                type="button"
                onClick={openNew}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
              >
                + Add {activeModel.name}
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : records.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-text-secondary">
              No {activeModel.name.toLowerCase()} records yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    {displayFields.map((f) => (
                      <th key={f.name} className="px-4 py-3 font-medium">
                        {f.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Updated</th>
                    {canManage ? <th className="px-4 py-3 font-medium">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      {displayFields.map((f) => (
                        <td key={f.name} className="max-w-[220px] truncate px-4 py-3">
                          {formatCell(r.fields[f.name])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="rounded-lg border border-border px-2 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(r)}
                              className="rounded-lg border border-border px-2 py-1 text-xs text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {editing && activeModel ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              {editing === "new" ? `Add ${activeModel.name}` : `Edit ${activeModel.name}`}
            </h2>
            <div className="mt-4 space-y-3">
              {activeModel.fields.map((f) => (
                <label key={f.name} className="block text-sm">
                  <span className="mb-1 block font-medium">
                    {f.name}
                    {f.required ? " *" : ""}
                  </span>
                  {f.type === "boolean" ? (
                    <select
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                      value={form[f.name] === "true" ? "true" : "false"}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : f.type === "text" || f.type === "json" ? (
                    <textarea
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                      rows={3}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type={inputTypeFor(f.type)}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  )}
                  {f.description ? (
                    <span className="mt-1 block text-xs text-text-muted">{f.description}</span>
                  ) : null}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: accent }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function inputTypeFor(type: string): string {
  switch (type) {
    case "number":
    case "money":
      return "number";
    case "date":
      return "date";
    case "datetime":
      return "datetime-local";
    case "email":
      return "email";
    case "url":
      return "url";
    default:
      return "text";
  }
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
