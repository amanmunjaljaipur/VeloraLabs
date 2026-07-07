import { resetPasswordSchema } from "@/lib/auth-validation";
import { updateManualUserPassword } from "@/lib/manual-users";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const RESET_LIMIT = 10;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`reset-password:${ip}`, RESET_LIMIT, RESET_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email = consumePasswordResetToken(parsed.data.token);
    if (!email) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const updated = await updateManualUserPassword(email, parsed.data.password);
    if (!updated) {
      return NextResponse.json(
        { error: "We could not update your password. Please request a new reset link." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been updated. You can sign in now.",
    });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}