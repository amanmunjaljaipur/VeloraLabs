import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "www.verlinlabs.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

function shouldCanonicalize(host: string): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase();
  return normalized === "verlinlabs.com" || normalized.endsWith(".vercel.app");
}

function isRouterFlightRequest(request: NextRequest): boolean {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("next-router-state-tree") != null
  );
}

function resolveHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("x-vercel-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return raw.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function middleware(request: NextRequest) {
  const host = resolveHost(request);

  if (!shouldCanonicalize(host)) {
    return NextResponse.next();
  }

  const canonicalUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);

  // Next.js client navigations cannot follow cross-host redirects for RSC payloads.
  // Rewrite flight requests internally so soft navigation works on apex / preview hosts.
  if (isRouterFlightRequest(request)) {
    return NextResponse.rewrite(canonicalUrl);
  }

  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images/|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.txt$).*)",
  ],
};