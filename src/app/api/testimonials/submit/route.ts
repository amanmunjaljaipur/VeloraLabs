import { auth } from "@/auth";
import { createSubmission } from "@/lib/testimonial-submissions";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";

export const runtime = "nodejs";

const VALID_AUDIENCES = new Set(["students", "engineers", "professionals"]);

/**
 * Any signed-in user (LinkedIn, Google, or email/password) can submit a
 * testimonial. Name and photo come from the authenticated session - not
 * from the request body - so a submission can never impersonate someone
 * else. The quote and role/title are user-entered since LinkedIn's basic
 * "Sign In" OAuth scope does not expose headline/job-title data. Every
 * submission lands as "pending" and only appears on /testimonials after
 * an admin approves it.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`testimonial-submit:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many submissions, try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const quote = typeof body?.quote === "string" ? body.quote.trim() : "";
  const role = typeof body?.role === "string" ? body.role.trim() : "";
  const audience = typeof body?.audience === "string" ? body.audience : "";

  if (quote.length < 20 || quote.length > 800) {
    return NextResponse.json(
      { error: "Testimonial must be between 20 and 800 characters" },
      { status: 400 }
    );
  }
  if (!role || role.length > 100) {
    return NextResponse.json({ error: "Title/role is required" }, { status: 400 });
  }
  if (!VALID_AUDIENCES.has(audience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const name = session.user.name?.trim() || session.user.email.split("@")[0]!;
  const authProvider =
    session.user.authProvider === "linkedin" || session.user.authProvider === "credentials"
      ? session.user.authProvider
      : "google";

  const record = await createSubmission({
    quote,
    name,
    role,
    audience: audience as "students" | "engineers" | "professionals",
    image: session.user.image ?? null,
    email: session.user.email,
    authProvider,
  });

  return NextResponse.json({ submission: record }, { status: 201 });
}
