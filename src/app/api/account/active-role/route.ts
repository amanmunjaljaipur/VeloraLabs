import { auth } from "@/auth";
import { setActiveRole } from "@/lib/roles";
import { USER_ROLES } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ role: z.enum(USER_ROLES) });

/**
 * Lets a signed-in user switch which of their own already-assigned roles
 * they're currently viewing/operating the app as (the top-nav role switcher).
 * No admin gate beyond being logged in - you can only switch to a role you
 * already hold, enforced inside setActiveRole.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ok = await setActiveRole(session.user.email, parsed.data.role);
  if (!ok) {
    return NextResponse.json(
      { error: "You don't hold that role" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { success: true, activeRole: parsed.data.role },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
