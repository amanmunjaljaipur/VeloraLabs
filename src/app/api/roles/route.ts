import { auth } from "@/auth";
import { getAllUserRoles, getRoleForEmail, removeUserRole, setUserRole } from "@/lib/roles";
import { isAdminRole } from "@/lib/session-access";
import { LEARNER_ROLES, ROLE_LABELS, USER_ROLES, type UserRole } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const assignSchema = z.object({
  email: z.string().email(),
  role: z.enum(USER_ROLES),
});

const removeSchema = z.object({
  email: z.string().email(),
});

async function requireRoleManager() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
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

  const assignments = getAllUserRoles().map(({ email, role }) => ({
    email,
    role,
    label: ROLE_LABELS[role],
  }));

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const session = await requireRoleManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const actorRole = session.user.role;

    if (!canManageAssignment(actorRole, parsed.data.role)) {
      return NextResponse.json(
        { error: "You can only assign Student, Engineer, or Professional roles" },
        { status: 403 }
      );
    }

    const existingRole = getRoleForEmail(email);
    if (existingRole && !canManageAssignment(actorRole, existingRole)) {
      return NextResponse.json(
        { error: "You cannot change Admin or Super Admin assignments" },
        { status: 403 }
      );
    }

    if (email === session.user.email?.toLowerCase() && parsed.data.role !== actorRole) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    setUserRole(email, parsed.data.role);

    return NextResponse.json({
      success: true,
      assignment: {
        email,
        role: parsed.data.role,
        label: ROLE_LABELS[parsed.data.role],
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireRoleManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = removeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const actorRole = session.user.role;
    const existingRole = getRoleForEmail(email);

    if (existingRole && !canManageAssignment(actorRole, existingRole)) {
      return NextResponse.json(
        { error: "You cannot remove Admin or Super Admin assignments" },
        { status: 403 }
      );
    }

    if (email === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot remove your own role assignment" },
        { status: 400 }
      );
    }

    const removed = removeUserRole(email);
    if (!removed) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}