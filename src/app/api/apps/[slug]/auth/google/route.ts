import { auth } from "@/auth";
import { loginAppWithGoogle } from "@/lib/app-builder/app-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Completes Google sign-in for a generated app using the same Verlin Labs
 * Google OAuth settings (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
 *
 * Flow: App login → NextAuth Google → callback here → app session cookie → shop/admin.
 */
export async function GET(request: NextRequest, context: Ctx) {
  const { slug } = await context.params;
  const origin = request.nextUrl.origin;

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.redirect(
      new URL(`/apps/${slug}/login?error=google`, origin)
    );
  }

  const result = await loginAppWithGoogle(slug, {
    email,
    name: session.user?.name,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/apps/${slug}/login?error=${encodeURIComponent(result.error)}`,
        origin
      )
    );
  }

  return NextResponse.redirect(new URL(result.redirectTo, origin));
}
