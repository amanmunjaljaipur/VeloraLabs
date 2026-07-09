import { resendVerificationSchema } from "@/lib/auth-validation";
import { createEmailVerificationChallenge } from "@/lib/email-verification";
import {
  isEmailVerificationConfigured,
  sendEmailVerificationEmail,
} from "@/lib/email-verification-email";
import {
  ensureManualUsersLoaded,
  getManualUserByEmail,
  isManualUserEmailVerified,
} from "@/lib/manual-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const RESEND_LIMIT = 5;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`resend-verification:${ip}`, RESEND_LIMIT, RESEND_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const emailRateLimit = checkRateLimit(
      `resend-verification:email:${email}`,
      3,
      RESEND_WINDOW_MS
    );

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests for this email. Please try again later." },
        { status: 429 }
      );
    }

    await ensureManualUsersLoaded();
    const user = getManualUserByEmail(email);

    if (user && !isManualUserEmailVerified(user) && isEmailVerificationConfigured()) {
      const challenge = createEmailVerificationChallenge(email);
      const sent = await sendEmailVerificationEmail(email, challenge.plainToken, challenge.plainCode);

      if (!sent) {
        console.error(`Verification email failed for ${email}`);
      }
    } else if (user && !isManualUserEmailVerified(user)) {
      console.error("Verification resend requested but email delivery is not configured");
    }

    return NextResponse.json({
      success: true,
      message:
        "If an unverified account exists for this email, a new verification message has been sent.",
    });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}