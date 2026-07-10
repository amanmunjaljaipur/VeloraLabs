import { publicSessionView, resolveAppAccess } from "@/lib/app-builder/app-auth";
import { ensureTenantForProject, getTenant } from "@/lib/app-builder/tenant-store";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  let tenant = await getTenant(slug);
  if (!tenant) {
    const project = await getAppProjectBySlug(slug);
    if (project?.status === "live") tenant = await ensureTenantForProject(project);
  }
  const ctx = await resolveAppAccess(slug);
  return NextResponse.json({
    user: publicSessionView(ctx),
    defaultRoleId: tenant?.defaultRoleId || "customer",
    roles: tenant?.roles.map((r) => ({
      id: r.id,
      label: r.label,
      description: r.description,
      isDefault: r.isDefault,
      system: r.system,
    })),
  });
}
