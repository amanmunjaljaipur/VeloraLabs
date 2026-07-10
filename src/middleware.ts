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

function isStandaloneAppPath(pathname: string): boolean {
  // Locked full-viewport shell (inner scroll only). Gallery index stays normal document scroll.
  return (
    pathname === "/apps" ||
    pathname.startsWith("/apps/") ||
    pathname.startsWith("/api/apps/") ||
    /^\/demo-apps\/[^/]+\/?$/.test(pathname)
  );
}

/** Forward request with optional standalone-app flag for root layout. */
function nextWithAppShell(request: NextRequest, standalone: boolean) {
  if (!standalone) return NextResponse.next();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vl-app-shell", "1");
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function middleware(request: NextRequest) {
  const host = resolveHost(request);
  const pathname = request.nextUrl.pathname;
  const standalone = isStandaloneAppPath(pathname);

  if (!shouldCanonicalize(host)) {
    return nextWithAppShell(request, standalone);
  }

  const canonicalUrl = new URL(pathname + request.nextUrl.search, CANONICAL_ORIGIN);

  // Next.js client navigations cannot follow cross-host redirects for RSC payloads.
  // Rewrite flight requests internally so soft navigation works on apex / preview hosts.
  if (isRouterFlightRequest(request)) {
    if (standalone) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-vl-app-shell", "1");
      return NextResponse.rewrite(canonicalUrl, {
        request: { headers: requestHeaders },
      });
    }
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
