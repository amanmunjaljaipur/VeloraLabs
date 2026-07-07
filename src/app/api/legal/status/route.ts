import { auth } from "@/auth";
import { getLegalAcceptance, needsLegalAcceptance } from "@/lib/legal/acceptances";
import {
  LEGAL_ACCEPTANCE_COOKIE,
  parseLegalAcceptanceCookie,
} from "@/lib/legal/acceptance-cookie";
import { getCurrentVersions, getPublicDocument } from "@/lib/legal/store";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false });
  }

  const email = session.user.email;
  const versions = getCurrentVersions();
  const record = getLegalAcceptance(email);
  const sessionAccepted =
    session.user.legalTermsVersion != null && session.user.legalPrivacyVersion != null
      ? {
          termsVersion: session.user.legalTermsVersion,
          privacyVersion: session.user.legalPrivacyVersion,
        }
      : null;
  const cookieStore = await cookies();
  const cookieAccepted = parseLegalAcceptanceCookie(
    cookieStore.get(LEGAL_ACCEPTANCE_COOKIE)?.value,
    email
  );
  const pending = needsLegalAcceptance(email, sessionAccepted, cookieAccepted);

  return NextResponse.json({
    authenticated: true,
    pending,
    current: versions,
    accepted: record
      ? {
          termsVersion: record.termsVersion,
          privacyVersion: record.privacyVersion,
          acceptedAt: record.acceptedAt,
        }
      : null,
    terms: pending ? getPublicDocument("terms") : undefined,
    privacy: pending ? getPublicDocument("privacy") : undefined,
  });
}