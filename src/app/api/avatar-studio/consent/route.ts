import { auth } from "@/auth";
import {
  getAllConsent,
  grantConsent,
  withdrawConsent,
  AVATAR_CONSENT_VERSIONS,
  type AvatarConsentType,
} from "@/lib/avatar-studio/consent-store";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_TYPES = new Set<AvatarConsentType>(["voice_face_clone", "training_data"]);

/** Feature-scoped consent (Voice/Face Cloning Authorization, Model Improvement opt-in) - separate from the site-wide ToS/Privacy gate. See consent-store.ts for why. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await getAllConsent(session.user.email);
  const byType = Object.fromEntries(
    Array.from(VALID_TYPES).map((type) => {
      const record = records.find((r) => r.type === type) ?? null;
      const current = Boolean(record?.granted && record.version >= AVATAR_CONSENT_VERSIONS[type]);
      return [type, { granted: current, record }];
    })
  );

  return NextResponse.json({ consent: byType });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const type = body?.type;
  const action = body?.action;

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid consent type" }, { status: 400 });
  }
  if (action !== "grant" && action !== "withdraw") {
    return NextResponse.json({ error: "action must be 'grant' or 'withdraw'" }, { status: 400 });
  }

  const record =
    action === "grant"
      ? await grantConsent(session.user.email, type, getClientIp(req))
      : await withdrawConsent(session.user.email, type);

  return NextResponse.json({ consent: record });
}
