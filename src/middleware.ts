import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "www.verlinlabs.com";

function shouldRedirectToCanonical(host: string): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase();
  return (
    normalized === "verlinlabs.com" ||
    normalized.endsWith(".vercel.app")
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";

  if (!shouldRedirectToCanonical(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https";
  url.host = CANONICAL_HOST;

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/login",
    "/signup",
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};