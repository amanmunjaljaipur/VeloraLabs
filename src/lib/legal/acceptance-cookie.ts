import { resolveAuthSecret } from "@/lib/auth-secret";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import type { LegalAcceptanceVersions } from "./acceptances";

export const LEGAL_ACCEPTANCE_COOKIE = "verlin-legal-accept";
const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60;

interface LegalAcceptanceCookiePayload {
  email: string;
  termsVersion: number;
  privacyVersion: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getCookieSecret(): string {
  return resolveAuthSecret();
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getCookieSecret()).update(encodedPayload).digest("base64url");
}

function encodePayload(payload: LegalAcceptanceCookiePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function decodePayload(cookieValue: string): LegalAcceptanceCookiePayload | null {
  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as LegalAcceptanceCookiePayload;

    if (
      typeof parsed.email !== "string" ||
      typeof parsed.termsVersion !== "number" ||
      typeof parsed.privacyVersion !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function parseLegalAcceptanceCookie(
  cookieValue: string | undefined,
  email: string
): LegalAcceptanceVersions | null {
  if (!cookieValue) return null;

  const payload = decodePayload(cookieValue);
  if (!payload) return null;
  if (normalizeEmail(payload.email) !== normalizeEmail(email)) return null;

  return {
    termsVersion: payload.termsVersion,
    privacyVersion: payload.privacyVersion,
  };
}

export function setLegalAcceptanceCookie(
  response: NextResponse,
  email: string,
  versions: LegalAcceptanceVersions
): void {
  const payload: LegalAcceptanceCookiePayload = {
    email: normalizeEmail(email),
    termsVersion: versions.termsVersion,
    privacyVersion: versions.privacyVersion,
  };

  response.cookies.set(LEGAL_ACCEPTANCE_COOKIE, encodePayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}