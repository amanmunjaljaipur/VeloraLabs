import { auth } from "@/auth";
import { getAllCourseTracks, type AudienceSlug } from "@/lib/content";
import {
  getAllModuleAccessGrants,
  removeModuleAccessGrant,
  setModuleAccessGrant,
  type ModuleAccessScope,
} from "@/lib/module-access";
import { isAdminRole } from "@/lib/session-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const grantSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  audience: z.enum(["students", "engineers", "professionals"]),
  scope: z.enum(["full", "modules"]),
  allowedDays: z.array(z.number().int().positive()).optional(),
});

const removeSchema = z.object({
  email: z.string().email(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const grants = getAllModuleAccessGrants();
  const programs = getAllCourseTracks().map(({ slug, course }) => ({
    slug,
    title: course.title,
    phases: course.phases.map((phase, phaseIndex) => ({
      index: phaseIndex,
      title: phase.title,
      days: phase.days.map((day) => ({
        day: day.day,
        title: day.title,
      })),
    })),
  }));

  return NextResponse.json({ grants, programs });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = grantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const grant = setModuleAccessGrant(
      {
        email: parsed.data.email,
        name: parsed.data.name,
        audience: parsed.data.audience as AudienceSlug,
        scope: parsed.data.scope as ModuleAccessScope,
        allowedDays: parsed.data.allowedDays,
      },
      session.user.email ?? "admin"
    );

    return NextResponse.json({ success: true, grant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const removed = removeModuleAccessGrant(parsed.data.email);
    if (!removed) {
      return NextResponse.json({ error: "Access grant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}