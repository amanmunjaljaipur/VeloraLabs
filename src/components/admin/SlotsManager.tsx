"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Clock, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type SlotCategory = "free" | "students" | "engineers" | "professionals";

interface ManagedSlot {
  id: string;
  category: SlotCategory;
  time: string;
  capacity: number;
  createdBy?: string;
  createdAt: string;
}

interface CategoryOption {
  value: SlotCategory;
  label: string;
}

const CATEGORY_META: Record<SlotCategory, { label: string; accent: string }> = {
  free: { label: "Free Session", accent: "border-teal/30 bg-teal/5" },
  students: { label: "Students", accent: "border-accent-amber/30 bg-cta-amber-light" },
  engineers: { label: "Engineers", accent: "border-accent-teal/30 bg-accent-teal/5" },
  professionals: { label: "Professionals", accent: "border-navy/20 bg-navy/5" },
};

function formatTime12h(time: string): string {
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function SlotsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [slots, setSlots] = useState<ManagedSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<{ category: SlotCategory; time: string; capacity: string }>({
    category: "free",
    time: "10:00",
    capacity: "5",
  });

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slots");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCategories(data.categories ?? []);
      setSlots(data.slots ?? []);
    } catch {
      toast("Failed to load session slots", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  const grouped = useMemo(() => {
    const byCategory = new Map<SlotCategory, ManagedSlot[]>();
    for (const slot of slots) {
      const list = byCategory.get(slot.category) ?? [];
      list.push(slot);
      byCategory.set(slot.category, list);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return byCategory;
  }, [slots]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          time: form.time,
          capacity: Number(form.capacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not create slot", "error");
        return;
      }
      toast("Slot added", "success");
      setSlots((prev) => [...prev, data.slot]);
    } catch {
      toast("Could not create slot", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/slots?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast("Could not remove slot", "error");
        return;
      }
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast("Slot removed", "success");
    } catch {
      toast("Could not remove slot", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading session slots…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Add a session slot</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create a daily time slot for a specific track. Students, Engineers, and
          Professionals each get their own bookable pool - if a track has no
          slots of its own yet, it automatically falls back to the Free
          Session pool so booking never breaks.
        </p>
        <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SlotCategory }))}
            options={
              categories.length
                ? categories.map((c) => ({ value: c.value, label: c.label }))
                : Object.entries(CATEGORY_META).map(([value, meta]) => ({ value, label: meta.label }))
            }
          />
          <Input
            label="Time (24h)"
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            required
          />
          <Input
            label="Capacity (seats)"
            type="number"
            min={1}
            max={500}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            required
          />
          <Button type="submit" loading={saving} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add slot
          </Button>
        </form>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {(Object.keys(CATEGORY_META) as SlotCategory[]).map((category) => {
          const meta = CATEGORY_META[category];
          const categorySlots = grouped.get(category) ?? [];
          const usingFallback = category !== "free" && categorySlots.length === 0;

          return (
            <Card key={category} className={cn("p-5", meta.accent)}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{meta.label}</h3>
                <Badge>{categorySlots.length} slot{categorySlots.length === 1 ? "" : "s"}</Badge>
              </div>

              {usingFallback && (
                <p className="mt-2 text-xs text-text-secondary">
                  No dedicated slots yet - currently using the Free Session pool.
                </p>
              )}

              <ul className="mt-4 space-y-2">
                {categorySlots.length === 0 && !usingFallback && (
                  <li className="text-sm text-text-secondary">No slots configured.</li>
                )}
                {categorySlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-3.5 w-3.5 text-text-secondary" />
                      {formatTime12h(slot.time)}
                      <span className="mx-1 text-text-secondary">·</span>
                      <Users className="h-3.5 w-3.5 text-text-secondary" />
                      {slot.capacity} seats
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(slot.id)}
                      disabled={deletingId === slot.id}
                      aria-label="Remove slot"
                      className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === slot.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
