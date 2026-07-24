import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { deleteProspect, listProspects, updateProspectStatus, type ProspectStatus } from "@/lib/marketing/prospects-store";
import { upsertLead } from "@/lib/marketing/leads-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_STATUSES: ProspectStatus[] = ["suggested", "confirmed", "promoted", "rejected"];

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const prospects = await listProspects(tenantId);
  return NextResponse.json({ prospects });
}

/**
 * PATCH { id, status, email? } - confirm/reject a suggestion, or "promote"
 * it (status: "promoted" + the human-confirmed email address) which also
 * creates a real Lead so campaigns can actually send to it.
 */
export async function PATCH(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!id || !VALID_STATUSES.includes(status as ProspectStatus)) {
    return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const prospect = await updateProspectStatus(id, tenantId, status as ProspectStatus);
  if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  if (status === "promoted") {
    const email = typeof body?.email === "string" && body.email.includes("@") ? body.email : prospect.guessedEmails[0];
    if (email) {
      await upsertLead({
        tenantId,
        email,
        name: prospect.name,
        company: prospect.company,
        source: "manual",
        notes: `Promoted from AI prospect finder: ${prospect.rationale}`,
      });
    }
  }

  return NextResponse.json({ prospect });
}

export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tenantId = await resolveTenantId(session.user?.email);
  const ok = await deleteProspect(id, tenantId);
  return NextResponse.json({ deleted: ok });
}
