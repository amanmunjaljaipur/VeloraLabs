import { recordLegalAcceptance } from "@/lib/legal/acceptances";
import { setLegalAcceptanceCookie } from "@/lib/legal/acceptance-cookie";
import { getCurrentVersions } from "@/lib/legal/store";
import { recordKnownUser } from "@/lib/known-users";
import {
  getManualUserByEmail,
  isManualUserEmailVerified,
  markManualUserEmailVerified,
} from "@/lib/manual-users";
import type { NextResponse } from "next/server";

export async function completeEmailVerification(
  email: string,
  response?: NextResponse
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const normalized = email.toLowerCase().trim();
  const user = getManualUserByEmail(normalized);

  if (!user) {
    return { ok: false, error: "No account found for this email." };
  }

  if (isManualUserEmailVerified(user)) {
    return { ok: true, email: normalized };
  }

  const marked = await markManualUserEmailVerified(normalized);
  if (!marked) {
    return { ok: false, error: "Could not verify this account." };
  }

  try {
    await recordKnownUser(normalized, user.name, "credentials");
  } catch (error) {
    console.error("Failed to record known user after email verification:", error);
  }

  try {
    recordLegalAcceptance(normalized);
  } catch (error) {
    console.error("Failed to record legal acceptance after email verification:", error);
  }

  if (response) {
    setLegalAcceptanceCookie(response, normalized, getCurrentVersions());
  }

  return { ok: true, email: normalized };
}