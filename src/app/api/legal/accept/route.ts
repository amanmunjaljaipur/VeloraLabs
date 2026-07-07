import { auth } from "@/auth";
import { recordLegalAcceptance } from "@/lib/legal/acceptances";
import { setLegalAcceptanceCookie } from "@/lib/legal/acceptance-cookie";
import { getCurrentVersions } from "@/lib/legal/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = recordLegalAcceptance(session.user.email);
  const current = getCurrentVersions();

  const response = NextResponse.json({
    ok: true,
    accepted: record,
    current,
  });
  setLegalAcceptanceCookie(response, session.user.email, current);
  return response;
}