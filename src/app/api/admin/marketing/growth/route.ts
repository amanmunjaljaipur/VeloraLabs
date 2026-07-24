import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listGrowthMemory } from "@/lib/marketing/growth-memory-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { findTenantByMemberEmail, ensureDefaultTenant, setAutoGrowth } from "@/lib/marketing/tenants-store";
import { isGrowthAdvisorConfigured } from "@/lib/marketing/ai-growth-advisor";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** History of daily/manual strategy runs, plus whether daily auto-execute is on for this workspace. */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const history = await listGrowthMemory(tenantId, 30);
  const tenant =
    (await findTenantByMemberEmail(session.user?.email ?? "")) ?? (await ensureDefaultTenant(session.user?.email ?? ""));

  return NextResponse.json({
    history,
    autoGrowthEnabled: tenant.autoGrowthEnabled,
    configured: isGrowthAdvisorConfigured(),
  });
}

/** Body: { autoGrowthEnabled: boolean } - toggles daily auto-execute for this workspace. */
export async function PATCH(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (typeof body?.autoGrowthEnabled !== "boolean") {
    return NextResponse.json({ error: "autoGrowthEnabled boolean is required" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const tenant = await setAutoGrowth(tenantId, body.autoGrowthEnabled);
  if (!tenant) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  return NextResponse.json({ autoGrowthEnabled: tenant.autoGrowthEnabled });
}
