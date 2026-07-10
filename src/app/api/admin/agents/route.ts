import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import {
  listAgentsWithStatus,
  pauseAllRuntimeAgents,
  resumeAllAgents,
  setAgentPaused,
} from "@/lib/agents/controls";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Super Admin: list all platform agents + pause state */
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const agents = await listAgentsWithStatus();
  const runtime = agents.filter((a) => a.pausableRuntime);
  const paused = agents.filter((a) => a.paused);

  return NextResponse.json({
    agents,
    summary: {
      total: agents.length,
      runtime: runtime.length,
      paused: paused.length,
      active: agents.length - paused.length,
    },
  });
}

/**
 * Super Admin: pause / resume agents
 * Body: { agentId, paused } | { action: "pause_all_runtime" | "resume_all" }
 */
export async function PATCH(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    agentId?: string;
    paused?: boolean;
    note?: string;
    action?: "pause_all_runtime" | "resume_all";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const by = session.user?.email || "super_admin";

  if (body.action === "pause_all_runtime") {
    const n = await pauseAllRuntimeAgents(by);
    const agents = await listAgentsWithStatus();
    return NextResponse.json({ ok: true, pausedCount: n, agents });
  }

  if (body.action === "resume_all") {
    const n = await resumeAllAgents(by);
    const agents = await listAgentsWithStatus();
    return NextResponse.json({ ok: true, resumedCount: n, agents });
  }

  if (!body.agentId || typeof body.paused !== "boolean") {
    return NextResponse.json(
      { error: "agentId and paused (boolean) required" },
      { status: 400 }
    );
  }

  const row = await setAgentPaused({
    agentId: body.agentId,
    paused: body.paused,
    byEmail: by,
    note: body.note,
  });
  if (!row) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, agent: row });
}
