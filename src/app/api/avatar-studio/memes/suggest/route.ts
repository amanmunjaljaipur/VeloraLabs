import { auth } from "@/auth";
import { suggestMemesForScript } from "@/lib/avatar-studio/meme-suggest";
import { resolveClipId } from "@/lib/avatar-studio/meme-resolve";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST { script } → genre + placement suggestions with free clip options.
 * Optionally resolves live free download URLs when PEXELS_API_KEY is set.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const script = typeof body?.script === "string" ? body.script.trim() : "";
  if (!script || script.length < 12) {
    return NextResponse.json({ error: "Paste a longer script first (at least a sentence)." }, { status: 400 });
  }
  if (script.length > 20_000) {
    return NextResponse.json({ error: "Script too long" }, { status: 400 });
  }

  const maxPlacements =
    typeof body?.maxPlacements === "number" ? Math.min(6, Math.max(1, body.maxPlacements)) : 4;
  const resolveUrls = body?.resolveUrls === true;

  const result = suggestMemesForScript(script, maxPlacements);

  // Optionally attach live free URLs for default clips
  if (resolveUrls) {
    for (const p of result.placements) {
      const resolved = await resolveClipId(p.defaultClipId);
      if (resolved) {
        (p as { resolvedUrl?: string; resolveSource?: string }).resolvedUrl = resolved.url;
        (p as { resolveSource?: string }).resolveSource = resolved.source;
      }
    }
  }

  return NextResponse.json({
    ...result,
    pexelsConfigured: Boolean(process.env.PEXELS_API_KEY?.trim()),
  });
}
