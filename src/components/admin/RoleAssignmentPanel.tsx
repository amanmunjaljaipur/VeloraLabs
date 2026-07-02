"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/types/roles";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Assignment {
  email: string;
  role: UserRole;
  label: string;
}

const roleOptions = USER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export function RoleAssignmentPanel({ currentUserEmail }: { currentUserEmail: string }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const fetchAssignments = useCallback(async () => {
    const res = await fetch("/api/roles");
    if (!res.ok) {
      toast("Failed to load role assignments", "error");
      return;
    }
    const data = (await res.json()) as { assignments: Assignment[] };
    setAssignments(data.assignments);
  }, [toast]);

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false));
  }, [fetchAssignments]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast(data.error || "Failed to assign role", "error");
        return;
      }

      toast(`Role updated for ${email}`, "success");
      setEmail("");
      setRole("student");
      await fetchAssignments();
    } catch {
      toast("Failed to assign role", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assignmentEmail: string) => {
    try {
      const res = await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: assignmentEmail }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast(data.error || "Failed to remove assignment", "error");
        return;
      }

      toast(`Removed role assignment for ${assignmentEmail}`, "success");
      await fetchAssignments();
    } catch {
      toast("Failed to remove assignment", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 md:px-8">
      <Card>
        <h2 className="text-lg font-semibold text-foreground">Assign Role</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Enter a user&apos;s email and select one of the five roles. Users without an
          assignment default to Student.
        </p>
        <form onSubmit={handleAssign} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            Assign Role
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Current Assignments</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {assignments.length} user{assignments.length === 1 ? "" : "s"} with custom roles.
        </p>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <p className="mt-6 text-sm text-text-secondary">No custom role assignments yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {assignments.map((assignment) => {
              const isSelf = assignment.email === currentUserEmail.toLowerCase();
              return (
                <li
                  key={assignment.email}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{assignment.email}</p>
                    <div className="mt-1">
                      <Badge>{assignment.label}</Badge>
                    </div>
                  </div>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleRemove(assignment.email)}
                      className="shrink-0 rounded-xl p-2 text-text-secondary transition-colors hover:bg-muted hover:text-red-500"
                      aria-label={`Remove role for ${assignment.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}