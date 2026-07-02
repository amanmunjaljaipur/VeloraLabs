"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { LEARNER_ROLES, ROLE_LABELS, USER_ROLES, type UserRole } from "@/types/roles";
import { Mail, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Assignment {
  email: string;
  role: UserRole;
  label: string;
}

interface UnassignedUser {
  email: string;
  name: string | null;
  provider: "google" | "credentials";
  firstSeenAt: string;
  lastSeenAt: string;
}

function getAssignableRoles(actorRole: UserRole) {
  const roles = actorRole === "super_admin" ? USER_ROLES : LEARNER_ROLES;
  return roles.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));
}

function canManageAssignment(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "super_admin") return true;
  return (LEARNER_ROLES as readonly UserRole[]).includes(targetRole);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const providerLabels = {
  google: "Google",
  credentials: "Email",
} as const;

export function RoleAssignmentPanel({
  currentUserEmail,
  actorRole,
}: {
  currentUserEmail: string;
  actorRole: UserRole;
}) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigningEmail, setAssigningEmail] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [email, setEmail] = useState("");
  const roleOptions = getAssignableRoles(actorRole);
  const [role, setRole] = useState<UserRole>(roleOptions[0]?.value ?? "student");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [rowRoles, setRowRoles] = useState<Record<string, UserRole>>({});
  const [bulkRole, setBulkRole] = useState<UserRole>("student");
  const isSuperAdmin = actorRole === "super_admin";

  const fetchAssignments = useCallback(async () => {
    const res = await fetch("/api/roles");
    if (!res.ok) {
      toast("Failed to load role assignments", "error");
      return;
    }
    const data = (await res.json()) as {
      assignments: Assignment[];
      unassigned?: UnassignedUser[];
    };
    setAssignments(data.assignments);
    setUnassigned(data.unassigned ?? []);
    setSelectedEmails(new Set());
    setRowRoles(
      Object.fromEntries(
        (data.unassigned ?? []).map((user) => [user.email, "student" as UserRole])
      )
    );
  }, [toast]);

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false));
  }, [fetchAssignments]);

  const allUnassignedSelected = useMemo(
    () => unassigned.length > 0 && selectedEmails.size === unassigned.length,
    [selectedEmails.size, unassigned.length]
  );

  const assignRole = async (targetEmail: string, targetRole: UserRole) => {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role: targetRole }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to assign role");
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await assignRole(email, role);
      toast(`Role updated for ${email}`, "success");
      setEmail("");
      setRole("student");
      await fetchAssignments();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to assign role", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAssign = async (targetEmail: string) => {
    const targetRole = rowRoles[targetEmail] ?? "student";
    setAssigningEmail(targetEmail);

    try {
      await assignRole(targetEmail, targetRole);
      toast(`Assigned ${ROLE_LABELS[targetRole]} to ${targetEmail}`, "success");
      await fetchAssignments();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to assign role", "error");
    } finally {
      setAssigningEmail(null);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedEmails.size === 0) {
      toast("Select at least one user", "error");
      return;
    }

    setBulkAssigning(true);
    let successCount = 0;

    try {
      for (const targetEmail of selectedEmails) {
        await assignRole(targetEmail, bulkRole);
        successCount += 1;
      }
      toast(
        `Assigned ${ROLE_LABELS[bulkRole]} to ${successCount} user${successCount === 1 ? "" : "s"}`,
        "success"
      );
      await fetchAssignments();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to assign roles",
        "error"
      );
      if (successCount > 0) {
        await fetchAssignments();
      }
    } finally {
      setBulkAssigning(false);
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

  const toggleUser = (targetEmail: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(targetEmail)) {
        next.delete(targetEmail);
      } else {
        next.add(targetEmail);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allUnassignedSelected) {
      setSelectedEmails(new Set());
      return;
    }
    setSelectedEmails(new Set(unassigned.map((user) => user.email)));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 md:px-8">
      {isSuperAdmin && (
        <Card className="border-amber-500/25 bg-amber-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-foreground">
                  Users awaiting role assignment
                </h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                These users have signed in or registered but don&apos;t have a custom role yet.
                They currently default to Student and won&apos;t see enrolled learner features until
                you assign a role.
              </p>
            </div>
            <Badge className="w-fit shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {unassigned.length} pending
            </Badge>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : unassigned.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-text-secondary">
              Everyone who has signed in currently has a role assigned.
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Bulk assign selected</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {selectedEmails.size} of {unassigned.length} selected
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                  <div className="w-full sm:w-48">
                    <Select
                      label="Role for selected"
                      options={roleOptions}
                      value={bulkRole}
                      onChange={(e) => setBulkRole(e.target.value as UserRole)}
                    />
                  </div>
                  <Button
                    type="button"
                    loading={bulkAssigning}
                    disabled={selectedEmails.size === 0}
                    onClick={handleBulkAssign}
                    className="w-full sm:w-auto"
                  >
                    Assign to selected
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-text-secondary">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={allUnassignedSelected}
                            onChange={toggleSelectAll}
                            aria-label="Select all users without roles"
                            className="h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Sign-in</th>
                        <th className="px-4 py-3 font-medium">Last active</th>
                        <th className="px-4 py-3 font-medium">Assign role</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {unassigned.map((user) => (
                        <tr key={user.email} className="bg-card">
                          <td className="px-4 py-4 align-top">
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(user.email)}
                              onChange={() => toggleUser(user.email)}
                              aria-label={`Select ${user.email}`}
                              className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
                            />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <p className="font-medium text-foreground">{user.email}</p>
                            {user.name && (
                              <p className="mt-0.5 text-xs text-text-secondary">{user.name}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge className="bg-muted text-foreground">
                              {providerLabels[user.provider]}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 align-top text-text-secondary">
                            {formatDate(user.lastSeenAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <select
                              value={rowRoles[user.email] ?? "student"}
                              onChange={(e) =>
                                setRowRoles((prev) => ({
                                  ...prev,
                                  [user.email]: e.target.value as UserRole,
                                }))
                              }
                              className="h-10 w-full min-w-[10rem] rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent-teal focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
                            >
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Button
                              type="button"
                              size="sm"
                              loading={assigningEmail === user.email}
                              onClick={() => handleQuickAssign(user.email)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Assign
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-teal" />
          <h2 className="text-lg font-semibold text-foreground">Assign role by email</h2>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Manually assign a role using an email address — useful if someone hasn&apos;t appeared in
          the pending list yet.
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
              const canRemove = !isSelf && canManageAssignment(actorRole, assignment.role);
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
                  {canRemove && (
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