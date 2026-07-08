"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import type { AudienceSlug } from "@/lib/content";
import type { ModuleAccessScope, UserModuleAccessRecord } from "@/lib/module-access";
import { ROLE_LABELS } from "@/types/roles";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ProgramDay {
  day: number;
  title: string;
}

interface ProgramPhase {
  index: number;
  title: string;
  days: ProgramDay[];
}

interface ProgramOption {
  slug: AudienceSlug;
  title: string;
  phases: ProgramPhase[];
}

const audienceOptions = [
  { value: "students", label: "School Students" },
  { value: "engineers", label: "College Engineers" },
  { value: "professionals", label: "Product Managers" },
];

const scopeOptions = [
  { value: "full", label: "Full program access" },
  { value: "modules", label: "Selected modules only" },
];

const audienceLabels: Record<AudienceSlug, string> = {
  students: "School Students",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ModuleAccessPanel() {
  const { toast } = useToast();
  const [grants, setGrants] = useState<UserModuleAccessRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<AudienceSlug>("students");
  const [scope, setScope] = useState<ModuleAccessScope>("full");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  const activeProgram = useMemo(
    () => programs.find((program) => program.slug === audience),
    [programs, audience]
  );

  const fetchGrants = useCallback(async () => {
    const res = await fetch("/api/module-access");
    if (!res.ok) {
      toast("Failed to load course access grants", "error");
      return;
    }
    const data = (await res.json()) as {
      grants: UserModuleAccessRecord[];
      programs: ProgramOption[];
    };
    setGrants(data.grants);
    setPrograms(data.programs);
  }, [toast]);

  useEffect(() => {
    fetchGrants().finally(() => setLoading(false));
  }, [fetchGrants]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const togglePhase = (phase: ProgramPhase) => {
    const phaseDays = phase.days.map((day) => day.day);
    const allSelected = phaseDays.every((day) => selectedDays.has(day));

    setSelectedDays((prev) => {
      const next = new Set(prev);
      for (const day of phaseDays) {
        if (allSelected) {
          next.delete(day);
        } else {
          next.add(day);
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/module-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          audience,
          scope,
          allowedDays: scope === "modules" ? [...selectedDays] : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast(data.error || "Failed to save access grant", "error");
        return;
      }

      toast(`Access updated for ${email}`, "success");
      setEmail("");
      setName("");
      setScope("full");
      setSelectedDays(new Set());
      await fetchGrants();
    } catch {
      toast("Failed to save access grant", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (targetEmail: string) => {
    setRemovingEmail(targetEmail);
    try {
      const res = await fetch("/api/module-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast(data.error || "Failed to remove access grant", "error");
        return;
      }

      toast(`Removed access for ${targetEmail}`, "success");
      await fetchGrants();
    } catch {
      toast("Failed to remove access grant", "error");
    } finally {
      setRemovingEmail(null);
    }
  };

  const startEdit = (grant: UserModuleAccessRecord) => {
    setEmail(grant.email);
    setName(grant.name ?? "");
    setAudience(grant.audience);
    setScope(grant.scope);
    setSelectedDays(new Set(grant.allowedDays));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 md:px-8">
      <Card className="border-teal/20 bg-teal/5 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">How course access works</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              Use <strong>Role Assignment</strong> when someone should get the full program for a
              track (Student, Engineer, or Professional). Use this panel when you want to grant
              access to specific people by email — either the complete program or only selected
              modules/days.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-teal" />
          <h2 className="text-lg font-semibold text-foreground">Grant course access</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              placeholder="learner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Name (optional)"
              type="text"
              placeholder="Learner name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Program"
              options={audienceOptions}
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value as AudienceSlug);
                setSelectedDays(new Set());
              }}
            />
            <Select
              label="Access level"
              options={scopeOptions}
              value={scope}
              onChange={(e) => setScope(e.target.value as ModuleAccessScope)}
            />
          </div>

          {scope === "modules" && activeProgram && (
            <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Select modules / days</p>
              {activeProgram.phases.map((phase) => {
                const phaseDays = phase.days.map((day) => day.day);
                const selectedCount = phaseDays.filter((day) => selectedDays.has(day)).length;
                const allSelected = selectedCount === phaseDays.length && phaseDays.length > 0;

                return (
                  <div key={phase.title} className="rounded-xl border border-border bg-card p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => togglePhase(phase)}
                        className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{phase.title}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {selectedCount} of {phaseDays.length} days selected
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {phase.days.map((day) => (
                            <label
                              key={day.day}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDays.has(day.day)}
                                onChange={() => toggleDay(day.day)}
                                className="h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
                              />
                              <span className="truncate">
                                Day {day.day}: {day.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          <Button type="submit" loading={submitting}>
            Save access grant
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Current access grants</h2>
        <p className="mt-2 text-sm text-text-secondary">
          People listed here can open the training videos and documents you upload for their allowed
          modules.
        </p>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : grants.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-sm text-text-secondary">
            No custom module access grants yet. Add a learner above, or assign a full role from
            Role Assignment.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {grants.map((grant) => (
              <div
                key={grant.email}
                className="rounded-2xl border border-border bg-card p-4 md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{grant.name || grant.email}</p>
                      {grant.name && (
                        <p className="text-sm text-text-secondary">{grant.email}</p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-teal/20 bg-teal/10 text-teal">
                        {audienceLabels[grant.audience]}
                      </Badge>
                      <Badge className="border-border bg-muted text-foreground">
                        {grant.scope === "full"
                          ? "Full program"
                          : `${grant.allowedDays.length} module${grant.allowedDays.length === 1 ? "" : "s"}`}
                      </Badge>
                    </div>
                    {grant.scope === "modules" && (
                      <p className="mt-3 text-sm text-text-secondary">
                        Days: {grant.allowedDays.join(", ")}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-text-secondary">
                      Updated {formatDate(grant.updatedAt)} by {grant.grantedBy}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(grant)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={removingEmail === grant.email}
                      onClick={() => handleRemove(grant.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-border/80 p-5">
        <p className="text-sm text-text-secondary">
          For full-track enrollment with a standard role label, use{" "}
          <a href="/admin/role-assignment" className="font-medium text-teal hover:underline">
            Role Assignment
          </a>{" "}
          and assign {ROLE_LABELS.student}, {ROLE_LABELS.engineer}, or {ROLE_LABELS.professional}.
        </p>
      </Card>
    </div>
  );
}