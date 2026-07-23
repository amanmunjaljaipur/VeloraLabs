"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Check, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SubmissionStatus = "pending" | "approved" | "rejected";

interface TestimonialSubmission {
  id: string;
  quote: string;
  name: string;
  role: string;
  audience: "students" | "engineers" | "professionals";
  image: string | null;
  email: string;
  authProvider: "linkedin" | "google" | "credentials";
  status: SubmissionStatus;
  submittedAt: string;
}

const TABS: { value: SubmissionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function TestimonialsReview() {
  const { toast } = useToast();
  const [tab, setTab] = useState<SubmissionStatus>("pending");
  const [items, setItems] = useState<TestimonialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (status: SubmissionStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/testimonials?status=${status}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setItems(data.submissions ?? []);
    } catch {
      toast("Could not load testimonials", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  async function act(id: string, status: "approved" | "rejected") {
    setActingId(id);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast(status === "approved" ? "Approved" : "Rejected", "success");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast("Could not update testimonial", "error");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-navy text-white dark:bg-white dark:text-navy"
                : "border border-border text-text-secondary hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" aria-hidden="true" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-secondary">
          No {tab} testimonials right now.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-accent-teal text-sm font-semibold text-white">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-text-secondary">{item.role}</p>
                  </div>
                </div>
                <Badge variant="audience">{item.audience}</Badge>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</p>

              <p className="mt-3 text-xs text-text-secondary">
                {item.email} · via {item.authProvider} ·{" "}
                {new Date(item.submittedAt).toLocaleDateString()}
              </p>

              {tab === "pending" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    loading={actingId === item.id}
                    onClick={() => act(item.id, "approved")}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    loading={actingId === item.id}
                    onClick={() => act(item.id, "rejected")}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
