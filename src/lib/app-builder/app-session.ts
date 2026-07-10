import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { AppSessionPayload } from "@/lib/app-builder/tenant-types";
import { resolveAuthSecret } from "@/lib/auth-secret";

const COOKIE_PREFIX = "vl_app_sess_";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

function cookieName(slug: string): string {
  // Cookie names: keep ASCII-safe
  const safe = slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "app";
  return `${COOKIE_PREFIX}${safe}`;
}

function secret(): string {
  return resolveAuthSecret() || "dev-app-session-secret";
}

export function signAppSession(payload: Omit<AppSessionPayload, "exp">, maxAgeSec = MAX_AGE_SEC): string {
  const full: AppSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAppSessionToken(token: string | undefined | null): AppSessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppSessionPayload;
    if (!payload.email || !payload.slug || !payload.roleId) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAppSessionCookie(
  slug: string,
  payload: Omit<AppSessionPayload, "exp">
): Promise<void> {
  const token = signAppSession(payload);
  const jar = await cookies();
  // path=/ so /apps/{slug} pages and /api/apps/{slug} APIs both receive the cookie
  jar.set(cookieName(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAppSessionCookie(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(slug), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readAppSession(slug: string): Promise<AppSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(cookieName(slug))?.value;
  const payload = verifyAppSessionToken(token);
  if (!payload || payload.slug !== slug) return null;
  return payload;
}
