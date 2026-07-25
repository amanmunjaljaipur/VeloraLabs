import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { listLogPages, listLogs, type LogLevel } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Super-admin-only view into the durable critical-events log. GET with no
 * `page` param returns the page-wise index (for the left-hand picker); with
 * a `page` param it returns that page's entries in detail.
 */
export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? undefined;
  const level = (searchParams.get("level") as LogLevel | null) ?? undefined;
  const limitParam = Number(searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 1000) : 200;

  const pages = await listLogPages();

  if (!page) {
    return NextResponse.json(
      { pages },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const entries = await listLogs({ page, level: level || undefined, limit });
  return NextResponse.json(
    { pages, entries },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
