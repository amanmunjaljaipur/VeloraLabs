import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateStrategy, isGrowthAdvisorConfigured } from "@/lib/marketing/ai-growth-advisor";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** The "single button press: strategy" endpoint - reads current signals + prior memory, returns fresh insights. */
export async function POST() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isGrowthAdvisorConfigured()) {
    return NextResponse.json({ error: "AI is not configured (set GROQ_API_KEY or GEMINI_API_KEY)" }, { status: 503 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  try {
    const entry = await generateStrategy(tenantId, "manual");
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy generation failed" },
      { status: 502 }
    );
  }
}
