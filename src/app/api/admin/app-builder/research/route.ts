import { assertAgentActive } from "@/lib/agents/controls";
import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { getVerticalResearch, listVerticals, touchVerticalUse } from "@/lib/app-builder/ops-memory";
import { ensureVerticalResearched } from "@/lib/app-builder/vertical-research";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vertical Research Agent API.
 * GET: list verticals or one pack
 * POST: ensure research exists (runs immediately if missing) and save to ops DB
 */
export async function GET(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const verticalId = url.searchParams.get("verticalId");
  if (verticalId) {
    const pack = await getVerticalResearch(verticalId);
    return NextResponse.json({
      pack,
      exists: Boolean(pack),
      storage: "app-builder-ops-memory.json (Blob runtime - survives deploys)",
    });
  }
  const verticals = await listVerticals();
  return NextResponse.json({ verticals, count: verticals.length });
}

export async function POST(request: Request) {
  const paused = await assertAgentActive("app-vertical-research");
  if (paused) return NextResponse.json(paused, { status: 503 });

  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    verticalId?: string;
    label?: string;
    ideaPrompt?: string;
    force?: boolean;
    touchUse?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.verticalId?.trim()) {
    return NextResponse.json(
      { error: "verticalId required (e.g. ecom-local-shop, booking-local)" },
      { status: 400 }
    );
  }

  const result = await ensureVerticalResearched({
    verticalId: body.verticalId,
    label: body.label,
    ideaPrompt: body.ideaPrompt,
    force: body.force,
  });

  if (body.touchUse) {
    await touchVerticalUse(result.pack.id);
  }

  return NextResponse.json({
    ...result,
    message: result.created
      ? `Researched and saved ${result.pack.label} to operational memory (survives deploys)`
      : `Loaded existing research for ${result.pack.label} from operational memory`,
  });
}
