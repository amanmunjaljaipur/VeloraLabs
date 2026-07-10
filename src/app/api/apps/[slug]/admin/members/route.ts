import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { getTenant, upsertMember } from "@/lib/app-builder/tenant-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "team.view")) ||
    (await requireAppCapability(slug, "team.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    members: authz.tenant.members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      roleId: m.roleId,
      source: m.source,
      createdAt: m.createdAt,
    })),
    roles: authz.tenant.roles.map((r) => ({ id: r.id, label: r.label })),
  });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "team.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { email?: string; name?: string; password?: string; roleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  if (!email || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: "Email and password (8+ chars) required" }, { status: 400 });
  }

  const roleId = body.roleId || authz.tenant.defaultRoleId;
  if (roleId === "super_admin" && !authz.role.capabilities.includes("*")) {
    return NextResponse.json({ error: "Only Owner can assign Owner role" }, { status: 403 });
  }

  const member = await upsertMember(slug, {
    email,
    name: body.name || email.split("@")[0],
    password: body.password,
    roleId,
    source: "invited",
  });

  return NextResponse.json({
    member: {
      id: member.id,
      email: member.email,
      name: member.name,
      roleId: member.roleId,
    },
  });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "team.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { email?: string; roleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const email = body.email?.toLowerCase().trim();
  const member = tenant.members.find((m) => m.email === email);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (member.email === tenant.ownerEmail && body.roleId && body.roleId !== "super_admin") {
    return NextResponse.json({ error: "Cannot demote the shop owner" }, { status: 400 });
  }

  if (body.roleId) {
    if (body.roleId === "super_admin" && !authz.role.capabilities.includes("*")) {
      return NextResponse.json({ error: "Only Owner can assign Owner" }, { status: 403 });
    }
    member.roleId = body.roleId;
  }

  const { saveTenant } = await import("@/lib/app-builder/tenant-store");
  await saveTenant(tenant);
  return NextResponse.json({ ok: true, roleId: member.roleId });
}
