import { verifyEmailSchema } from "@/lib/auth-validation";
import { completeEmailVerification } from "@/lib/complete-email-verification";
import { verifyEmailByCode, verifyEmailByToken } from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const VERIFY_LIMIT = 10;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = req.nextUrl.origin;

  if (!token?.trim()) {
    return NextResponse.redirect(new URL("/signup/verify-email?error=missing_token", baseUrl));
  }

  const email = verifyEmailByToken(token.trim());
  if (!email) {
    return NextResponse.redirect(new URL("/signup/verify-email?error=invalid_token", baseUrl));
  }

  const result = await completeEmailVerification(email);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/signup/verify-email?email=${encodeURIComponent(email)}&error=verify_failed`, baseUrl)
    );
  }

  return NextResponse.redirect(
    new URL(`/login?verified=1&email=${encodeURIComponent(email)}`, baseUrl)
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`verify-email:${ip}`, VERIFY_LIMIT, VERIFY_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email =
      "token" in parsed.data
        ? verifyEmailByToken(parsed.data.token.trim())
        : verifyEmailByCode(parsed.data.email.toLowerCase().trim(), parsed.data.code)
          ? parsed.data.email.toLowerCase().trim()
          : null;

    if (!email) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Request a new email and try again." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, email });
    const result = await completeEmailVerification(email, response);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return response;
  } catch (error) {
    console.error("Email verification failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}