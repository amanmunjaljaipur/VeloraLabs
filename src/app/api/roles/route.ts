import { auth } from "@/auth";
import { ensureKnownUsersLoaded, getUsersWithoutRoleAssignment } from "@/lib/known-users";
import {
  ensureRolesLoaded,
  getAllUserRoles,
  getRolesForEmail,
  hasCustomRoleAssignment,
  isHardcodedSuperAdmin,
  removeUserRole,
  removeUserRoleFromSet,
  setUserRoles,
} from "@/lib/roles";
import { isAdminRole } from "@/lib/session-access";
import { LEARNER_ROLES, ROLE_LABELS, USER_ROLES, type UserRole } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Accepts either the legacy singular `role` or the current `roles` array so
// no existing caller breaks. At least one of the two must be present.
const assignSchema = z
  .object({
    email: z.string().email(),
    role: z.enum(USER_ROLES).optional(),
    roles: z.array(z.enum(USER_ROLES)).optional(),
  })
  .refine((v) => v.role || (v.roles && v.roles.length > 0), {
    message: "role or roles is required",
  });

const removeSchema = z.object({
  email: z.string().email(),
  // Optional: remove a single role from the set. Omit to remove the whole assignment.
  role: z.enum(USER_ROLES).optional(),
});

export const runtime = "nodejs";

async function requireRoleManager() {
  const session = await auth();
  if (!session?.user) return null;
  if (isHardcodedSuperAdmin(session.user.email)) return session;
  if (!isAdminRole(session.user.role)) return null;
  return session;
}

function isLearnerRole(role: UserRole): role is (typeof LEARNER_ROLES)[number] {
  return (LEARNER_ROLES as readonly UserRole[]).includes(role);
}

function canManageAssignment(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "super_admin") return true;
  if (actorRole === "admin") return isLearnerRole(targetRole);
  return false;
}

export async function GET() {
  const session = await requireRoleManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Always force-reload so list matches latest Blob writes from any instance
  await ensureRolesLoaded(true);
  await ensureKnownUsersLoaded();

  const assignments = getAllUserRoles().map(({ email, role, roles, activeRole }) => ({
    email,
    role,
    roles,
    activeRole,
    label: ROLE_LABELS[role],
    labels: roles.map((r) => ROLE_LABELS[r]),
  }));

  const payload: {
    assignments: typeof assignments;
    unassigned?: Awaited<ReturnType<typeof getUsersWithoutRoleAssignment>>;
  } = { assignments };

  if (
    session.user.role === "super_admin" ||
    isHardcodedSuperAdmin(session.user.email)
  ) {
    payload.unassigned = await getUsersWithoutRoleAssignment();
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await requireRoleManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureRolesLoaded(true);

  try {
    const body = await req.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const requestedRoles = Array.from(
      new Set(parsed.data.roles && parsed.data.roles.length > 0 ? parsed.data.roles : [parsed.data.role as UserRole])
    );
    const actorRole =
      session.user.role ||
      (isHardcodedSuperAdmin(session.user.email) ? ("super_admin" as const) : null);
    if (!actorRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!requestedRoles.every((r) => canManageAssignment(actorRole, r))) {
      return NextResponse.json(
        { error: "You can only assign Student, Engineer, or Professional roles" },
        { status: 403 }
      );
    }

    const existingRoles = getRolesForEmail(email);
    if (hasCustomRoleAssignment(email) && existingRoles.length > 0) {
      if (!existingRoles.every((r) => canManageAssignment(actorRole, r))) {
        return NextResponse.json(
          { error: "You cannot change Admin or Super Admin assignments" },
          { status: 403 }
        );
      }
    }

    const isSelf = email === session.user.email?.toLowerCase();
    if (isSelf && !requestedRoles.includes(actorRole)) {
      return NextResponse.json({ error: "You cannot remove your own current role" }, { status: 400 });
    }

    // Admins editing an existing (learner) assignment replace only the learner
    // roles they're allowed to touch - any admin/super_admin roles already on
    // the account are preserved rather than silently dropped.
    const preserved = existingRoles.filter((r) => !canManageAssignment(actorRole, r));
    const nextRoles = Array.from(new Set([...preserved, ...requestedRoles]));

    await setUserRoles(email, nextRoles, session.user.email ?? "admin");

    // Confirm what is stored after Blob write
    const confirmedRoles = getRolesForEmail(email);

    return NextResponse.json(
      {
        success: true,
        assignment: {
          email,
          roles: confirmedRoles,
          labels: confirmedRoles.map((r) => ROLE_LABELS[r]),
        },
        note: confirmedRoles.some((r) => r === "super_admin" || r === "admin")
          ? "Saved to Blob. They should refresh or re-open the site - powers load on next request."
          : "Saved to Blob. Takes effect on their next page load (no long wait).",
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Role assignment failed:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireRoleManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureRolesLoaded(true);

  try {
    const body = await req.json();
    const parsed = removeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const actorRole =
      session.user.role ||
      (isHardcodedSuperAdmin(session.user.email) ? ("super_admin" as const) : null);
    if (!actorRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const existingRoles = getRolesForEmail(email);
    if (hasCustomRoleAssignment(email) && existingRoles.length > 0) {
      if (!existingRoles.every((r) => canManageAssignment(actorRole, r))) {
        return NextResponse.json(
          { error: "You cannot remove Admin or Super Admin assignments" },
          { status: 403 }
        );
      }
    }

    if (email === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot remove your own role assignment" },
        { status: 400 }
      );
    }

    const removed = parsed.data.role
      ? await removeUserRoleFromSet(email, parsed.data.role, session.user.email ?? "admin")
      : await removeUserRole(email, session.user.email ?? "admin");
    if (!removed) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
