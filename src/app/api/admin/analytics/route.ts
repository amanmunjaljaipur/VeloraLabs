import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { loadAnalyticsDashboard } from "@/lib/analytics/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await loadAnalyticsDashboard();
  return NextResponse.json(data);
}