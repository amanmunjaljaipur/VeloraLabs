import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { findProspects, guessEmailPatterns, isProspectFinderConfigured } from "@/lib/marketing/ai-prospect-finder";
import { addProspects } from "@/lib/marketing/prospects-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * Body: { prompt, count? } - AI brainstorms target profiles matching the
 * ICP prompt and saves them as "suggested" prospects with pattern-guessed
 * emails. See prospects-store.ts for why these are unverified by design.
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isProspectFinderConfigured()) {
    return NextResponse.json({ error: "AI is not configured (set GROQ_API_KEY or GEMINI_API_KEY)" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  const count = Math.min(Math.max(Number(body?.count) || 8, 1), 15);

  try {
    const suggestions = await findProspects(prompt, count);
    const tenantId = await resolveTenantId(session.user?.email);
    const prospects = await addProspects(
      tenantId,
      prompt,
      suggestions.map((s) => ({
        name: s.name,
        title: s.title,
        company: s.company,
        domain: s.domain,
        guessedEmails: guessEmailPatterns(s.name, s.domain),
        rationale: s.rationale,
      }))
    );
    return NextResponse.json({ prospects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prospect search failed" },
      { status: 502 }
    );
  }
}
