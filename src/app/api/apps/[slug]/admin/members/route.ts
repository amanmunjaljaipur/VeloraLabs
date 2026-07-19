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

  // Do not silently overwrite an existing member's password (account takeover)
  const already = authz.tenant.members.find((m) => m.email === email);
  if (already) {
    return NextResponse.json(
      {
        error:
          "This email is already on the team. Change their role separately - invite cannot reset passwords.",
      },
      { status: 409 }
    );
  }

  const roleId = body.roleId || authz.tenant.defaultRoleId;
  const targetRole = authz.tenant.roles.find((r) => r.id === roleId);
  if (!targetRole) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }
  // Block assigning Owner or any * role unless caller is Owner
  if (
    (roleId === "super_admin" || targetRole.capabilities.includes("*")) &&
    !authz.role.capabilities.includes("*")
  ) {
    return NextResponse.json({ error: "Only Owner can assign Owner role" }, { status: 403 });
  }
  // Managers cannot grant roles.manage / team.manage above their own without being owner
  if (
    !authz.role.capabilities.includes("*") &&
    (targetRole.capabilities.includes("roles.manage") ||
      targetRole.capabilities.includes("team.manage"))
  ) {
    return NextResponse.json(
      { error: "You cannot assign a role with higher team/roles powers" },
      { status: 403 }
    );
  }

  const member = await upsertMember(slug, {
    email,
    name: body.name || email.split("@")[0],
    password: body.password,
    roleId: targetRole.id,
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
    const targetRole = tenant.roles.find((r) => r.id === body.roleId);
    if (!targetRole) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    if (
      (body.roleId === "super_admin" || targetRole.capabilities.includes("*")) &&
      !authz.role.capabilities.includes("*")
    ) {
      return NextResponse.json({ error: "Only Owner can assign Owner" }, { status: 403 });
    }
    if (
      !authz.role.capabilities.includes("*") &&
      (targetRole.capabilities.includes("roles.manage") ||
        targetRole.capabilities.includes("team.manage"))
    ) {
      return NextResponse.json(
        { error: "You cannot assign a role with higher team/roles powers" },
        { status: 403 }
      );
    }
    member.roleId = targetRole.id;
  }

  // Promoting to Owner: ensure super_admin role definition exists with full powers
  if (member.roleId === "super_admin") {
    const sa = tenant.roles.find((r) => r.id === "super_admin");
    if (!sa) {
      tenant.roles.unshift({
        id: "super_admin",
        label: "Owner",
        description: "Full control of this shop",
        capabilities: ["*"],
        system: true,
      });
    } else {
      sa.capabilities = ["*"];
      sa.system = true;
    }
  }

  const { saveTenant } = await import("@/lib/app-builder/tenant-store");
  await saveTenant(tenant);
  return NextResponse.json({
    ok: true,
    roleId: member.roleId,
    note:
      member.roleId === "super_admin"
        ? "Owner powers applied. Ask them to refresh the page (or sign out and back in) to see the full admin menu."
        : undefined,
  });
}
