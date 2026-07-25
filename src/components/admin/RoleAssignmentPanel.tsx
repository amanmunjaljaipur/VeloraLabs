"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { LEARNER_ROLES, ROLE_LABELS, USER_ROLES, type UserRole } from "@/types/roles";
import { Check, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Assignment {
  email: string;
  role: UserRole;
  roles: UserRole[];
  activeRole: UserRole | null;
  label: string;
  labels: string[];
}

interface UnassignedUser {
  email: string;
  name: string | null;
  provider: "google" | "credentials";
  firstSeenAt: string;
  lastSeenAt: string;
}

function getAssignableRoles(actorRole: UserRole): UserRole[] {
  return actorRole === "super_admin" ? [...USER_ROLES] : [...LEARNER_ROLES];
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

/** Toggle-chip multi-select used everywhere a set of roles needs picking. */
function RoleChips({
  roles,
  selected,
  disabledRoles,
  onToggle,
}: {
  roles: UserRole[];
  selected: UserRole[];
  disabledRoles?: UserRole[];
  onToggle: (role: UserRole) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const active = selected.includes(role);
        const disabled = disabledRoles?.includes(role) ?? false;
        return (
          <button
            key={role}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(role)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                : "border-border text-text-secondary hover:bg-muted hover:text-foreground"
            )}
          >
            {active && <Check className="h-3 w-3" />}
            {ROLE_LABELS[role]}
          </button>
        );
      })}
    </div>
  );
}

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
  const assignableRoles = useMemo(() => getAssignableRoles(actorRole), [actorRole]);
  const [newRoles, setNewRoles] = useState<Set<UserRole>>(new Set(["student"]));
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [rowRoles, setRowRoles] = useState<Record<string, Set<UserRole>>>({});
  const [bulkRoles, setBulkRoles] = useState<Set<UserRole>>(new Set(["student"]));
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
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
        (data.unassigned ?? []).map((user) => [user.email, new Set<UserRole>(["student"])])
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

  const assignRoles = async (targetEmail: string, targetRoles: UserRole[]) => {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, roles: targetRoles }),
    });
    const data = (await res.json()) as { error?: string; note?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to assign role");
    }
    return data.note;
  };

  const removeOneRole = async (targetEmail: string, targetRole: UserRole) => {
    const res = await fetch("/api/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role: targetRole }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to remove role");
    }
  };

  const successToast = (msg: string, note?: string) => {
    toast(note ? `${msg} ${note}` : msg, "success");
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoles.size === 0) {
      toast("Pick at least one role", "error");
      return;
    }
    setSubmitting(true);

    try {
      const note = await assignRoles(email, Array.from(newRoles));
      successToast(`Role${newRoles.size > 1 ? "s" : ""} updated for ${email}.`, note);
      setEmail("");
      setNewRoles(new Set(["student"]));
      await fetchAssignments();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to assign role", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAssign = async (targetEmail: string) => {
    const targetRoles = Array.from(rowRoles[targetEmail] ?? new Set<UserRole>(["student"]));
    if (targetRoles.length === 0) {
      toast("Pick at least one role", "error");
      return;
    }
    setAssigningEmail(targetEmail);

    try {
      const note = await assignRoles(targetEmail, targetRoles);
      successToast(
        `Assigned ${targetRoles.map((r) => ROLE_LABELS[r]).join(" + ")} to ${targetEmail}.`,
        note
      );
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
    if (bulkRoles.size === 0) {
      toast("Pick at least one role", "error");
      return;
    }

    setBulkAssigning(true);
    let successCount = 0;

    try {
      for (const targetEmail of selectedEmails) {
        await assignRoles(targetEmail, Array.from(bulkRoles));
        successCount += 1;
      }
      toast(
        `Assigned ${Array.from(bulkRoles).map((r) => ROLE_LABELS[r]).join(" + ")} to ${successCount} user${successCount === 1 ? "" : "s"}`,
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

  /** Toggle a single role on an existing user - add via POST, remove via DELETE. */
  const handleToggleAssignmentRole = async (assignment: Assignment, role: UserRole) => {
    setBusyEmail(assignment.email);
    try {
      if (assignment.roles.includes(role)) {
        await removeOneRole(assignment.email, role);
        toast(`Removed ${ROLE_LABELS[role]} from ${assignment.email}.`, "success");
      } else {
        const note = await assignRoles(assignment.email, [...assignment.roles, role]);
        successToast(`Added ${ROLE_LABELS[role]} to ${assignment.email}.`, note);
      }
      await fetchAssignments();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update roles", "error");
    } finally {
      setBusyEmail(null);
    }
  };

  const handleRemoveAll = async (assignmentEmail: string) => {
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

      toast(`Removed all roles for ${assignmentEmail}`, "success");
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

  const toggleSetRole = (set: Set<UserRole>, role: UserRole): Set<UserRole> => {
    const next = new Set(set);
    if (next.has(role)) {
      next.delete(role);
    } else {
      next.add(role);
    }
    return next;
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
                These users have signed in or registered but don&apos;t have a role yet. They see
                &quot;Role assignment pending&quot; until you assign at least one role. A user can
                hold more than one role at a time - pick as many as apply.
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
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                  <RoleChips
                    roles={assignableRoles}
                    selected={Array.from(bulkRoles)}
                    onToggle={(r) => setBulkRoles((prev) => toggleSetRole(prev, r))}
                  />
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
                        <th className="px-4 py-3 font-medium">Assign role(s)</th>
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
                            <RoleChips
                              roles={assignableRoles}
                              selected={Array.from(rowRoles[user.email] ?? [])}
                              onToggle={(r) =>
                                setRowRoles((prev) => ({
                                  ...prev,
                                  [user.email]: toggleSetRole(
                                    prev[user.email] ?? new Set(),
                                    r
                                  ),
                                }))
                              }
                            />
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
          <h2 className="text-lg font-semibold text-foreground">Assign role(s) by email</h2>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Manually assign one or more roles using an email address - useful if someone hasn&apos;t
          appeared in the pending list yet. A user can hold multiple roles at once.
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
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Roles</p>
            <RoleChips
              roles={assignableRoles}
              selected={Array.from(newRoles)}
              onToggle={(r) => setNewRoles((prev) => toggleSetRole(prev, r))}
            />
          </div>
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            Assign Role{newRoles.size > 1 ? "s" : ""}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Current Assignments</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {assignments.length} user{assignments.length === 1 ? "" : "s"} with custom roles. Click a
          role chip to add or remove it - a user can hold more than one.
          {isSuperAdmin && " As Super Admin, you can change any assignment below."}
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
              const editableRoles = assignment.roles.filter((r) => canManageAssignment(actorRole, r));
              const lockedRoles = assignment.roles.filter((r) => !canManageAssignment(actorRole, r));
              const canEdit = !isSelf;
              const busy = busyEmail === assignment.email;

              return (
                <li
                  key={assignment.email}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{assignment.email}</p>
                    {isSelf && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Your own roles cannot be changed here.
                      </p>
                    )}
                    {lockedRoles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {lockedRoles.map((r) => (
                          <Badge key={r} className="opacity-70">
                            {ROLE_LABELS[r]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    {canEdit ? (
                      <RoleChips
                        roles={assignableRoles}
                        selected={editableRoles}
                        disabledRoles={busy ? assignableRoles : undefined}
                        onToggle={(r) => handleToggleAssignmentRole(assignment, r)}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignment.roles.map((r) => (
                          <Badge key={r}>{ROLE_LABELS[r]}</Badge>
                        ))}
                      </div>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAll(assignment.email)}
                        className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-muted hover:text-red-500"
                        aria-label={`Remove all roles for ${assignment.email}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove all
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
