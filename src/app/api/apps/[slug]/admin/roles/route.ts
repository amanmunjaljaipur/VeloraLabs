import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { getDefaultRoleId } from "@/lib/app-builder/default-roles";
import { setTenantRoles } from "@/lib/app-builder/tenant-store";
import type { AppCapability, AppRoleDefinition } from "@/lib/app-builder/tenant-types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz = await requireAppCapability(slug, "roles.manage");
  // Also allow * via super_admin
  const alt = authz || (await requireAppCapability(slug, "*"));
  if (!alt) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tenant = alt.tenant;
  return NextResponse.json({
    roles: tenant.roles,
    defaultRoleId: tenant.defaultRoleId,
    members: tenant.members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      roleId: m.roleId,
      source: m.source,
      createdAt: m.createdAt,
      lastLoginAt: m.lastLoginAt,
    })),
  });
}

export async function PUT(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz = (await requireAppCapability(slug, "roles.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { roles?: AppRoleDefinition[]; defaultRoleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!Array.isArray(body.roles) || body.roles.length === 0) {
    return NextResponse.json({ error: "At least one role is required" }, { status: 400 });
  }

  // Always keep super_admin system role
  let roles = body.roles.map((r) => ({
    id: String(r.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .slice(0, 32),
    label: String(r.label || r.id).slice(0, 48),
    description: String(r.description || "").slice(0, 240),
    capabilities: (Array.isArray(r.capabilities) ? r.capabilities : []) as AppCapability[],
    system: Boolean(r.system),
    isDefault: Boolean(r.isDefault),
  }));

  if (!roles.some((r) => r.id === "super_admin")) {
    const existing = authz.tenant.roles.find((r) => r.id === "super_admin");
    if (existing) {
      roles = [
        {
          id: existing.id,
          label: existing.label,
          description: existing.description,
          capabilities: existing.capabilities,
          system: true,
          isDefault: false,
        },
        ...roles,
      ];
    }
  }
  roles = roles.map((r) =>
    r.id === "super_admin"
      ? { ...r, capabilities: ["*"] as AppCapability[], system: true, isDefault: false }
      : r
  );

  // Exactly one default
  const defaultRoleId =
    body.defaultRoleId && roles.some((r) => r.id === body.defaultRoleId)
      ? body.defaultRoleId
      : getDefaultRoleId(roles);
  roles = roles.map((r) => ({ ...r, isDefault: r.id === defaultRoleId }));

  const tenant = await setTenantRoles(slug, roles, defaultRoleId);
  return NextResponse.json({ roles: tenant.roles, defaultRoleId: tenant.defaultRoleId });
}
