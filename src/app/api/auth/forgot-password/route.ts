import { forgotPasswordSchema } from "@/lib/auth-validation";
import { ensureManualUsersLoaded, getManualUserByEmail } from "@/lib/manual-users";
import {
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/password-reset-email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const FORGOT_LIMIT = 5;
const FORGOT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`forgot-password:${ip}`, FORGOT_LIMIT, FORGOT_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const emailRateLimit = checkRateLimit(
      `forgot-password:email:${email}`,
      3,
      FORGOT_WINDOW_MS
    );

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset requests for this email. Please try again later." },
        { status: 429 }
      );
    }

    await ensureManualUsersLoaded();
    const manualUser = getManualUserByEmail(email);

    if (manualUser && isPasswordResetEmailConfigured()) {
      const token = await createPasswordResetToken(email);
      const sent = await sendPasswordResetEmail(email, token);

      if (!sent) {
        console.error(`Password reset email failed for ${email}`);
      }
    } else if (manualUser) {
      console.error("Password reset requested but email delivery is not configured");
    }

    return NextResponse.json({
      success: true,
      message:
        "If an email/password account exists for this address, you will receive reset instructions shortly.",
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}