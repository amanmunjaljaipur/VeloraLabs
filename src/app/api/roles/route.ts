import { auth } from "@/auth";
import { getAllUserRoles, removeUserRole, setUserRole } from "@/lib/roles";
import { ROLE_LABELS, USER_ROLES } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const assignSchema = z.object({
  email: z.string().email(),
  role: z.enum(USER_ROLES),
});

const removeSchema = z.object({
  email: z.string().email(),
});

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireSuperAdmin();
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
  const session = await requireSuperAdmin();
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
    if (email === session.user.email?.toLowerCase() && parsed.data.role !== "super_admin") {
      return NextResponse.json(
        { error: "You cannot change your own Super Admin role" },
        { status: 400 }
      );
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
  const session = await requireSuperAdmin();
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