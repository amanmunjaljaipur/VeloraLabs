import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { addTenantMember, createTenant, listTenants } from "@/lib/marketing/tenants-store";
import type { UserRole } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Workspace provisioning - the primitive a future self-serve signup flow
 * would call. Platform-owner only for now: creating a new isolated
 * Marketing Board workspace is a higher-trust action than anything inside
 * one, same reasoning as the OAuth connect routes.
 */
function isPlatformOwner(email: string | null | undefined, role: UserRole | null | undefined): boolean {
  return isHardcodedSuperAdmin(email) || isSuperAdminRole(role);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isPlatformOwner(session.user.email, session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenants = await listTenants();
  return NextResponse.json({
    tenants: tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      ownerEmail: t.ownerEmail,
      memberEmails: t.memberEmails,
      plan: t.plan,
      createdAt: t.createdAt,
    })),
  });
}

/** Body: { name, ownerEmail, plan? } - provisions a brand-new isolated workspace. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isPlatformOwner(session.user.email, session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const ownerEmail = typeof body?.ownerEmail === "string" ? body.ownerEmail.trim() : "";
  const plan = body?.plan === "pro" ? "pro" : "trial";

  if (!name || !ownerEmail || !ownerEmail.includes("@")) {
    return NextResponse.json({ error: "name and a valid ownerEmail are required" }, { status: 400 });
  }

  const tenant = await createTenant({ name, ownerEmail, plan });
  return NextResponse.json({ tenant }, { status: 201 });
}

/** Body: { tenantId, email } - adds a member to an existing workspace. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isPlatformOwner(session.user.email, session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!tenantId || !email || !email.includes("@")) {
    return NextResponse.json({ error: "tenantId and a valid email are required" }, { status: 400 });
  }

  const tenant = await addTenantMember(tenantId, email);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  return NextResponse.json({ tenant });
}
