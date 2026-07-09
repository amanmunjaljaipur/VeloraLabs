import { signUpSchema } from "@/lib/auth-validation";
import { createEmailVerificationChallenge } from "@/lib/email-verification";
import {
  isEmailVerificationConfigured,
  sendEmailVerificationEmail,
} from "@/lib/email-verification-email";
import { recordLegalAcceptance } from "@/lib/legal/acceptances";
import { setLegalAcceptanceCookie } from "@/lib/legal/acceptance-cookie";
import { getCurrentVersions } from "@/lib/legal/store";
import { createManualUser } from "@/lib/manual-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  if (!isEmailVerificationConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email verification is not available right now. Please try again later or sign in with Google.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { firstName, lastName, email, password, acceptTerms } = parsed.data;

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service and Privacy Policy" },
        { status: 400 }
      );
    }

    try {
      const user = await createManualUser({ firstName, lastName, email, password });

      const currentVersions = getCurrentVersions();
      try {
        recordLegalAcceptance(user.email);
      } catch (error) {
        console.error("Failed to record legal acceptance after registration:", error);
      }

      const challenge = createEmailVerificationChallenge(user.email);
      const sent = await sendEmailVerificationEmail(
        user.email,
        challenge.plainToken,
        challenge.plainCode
      );

      if (!sent) {
        console.error(`Verification email failed for ${user.email}`);
        return NextResponse.json(
          {
            error:
              "Your account was created but we could not send the verification email. Use resend on the verification page.",
          },
          { status: 503 }
        );
      }

      const response = NextResponse.json({
        success: true,
        requiresVerification: true,
        email: user.email,
        message: "Check your email for a verification link or 6-digit code to finish sign-up.",
      });
      setLegalAcceptanceCookie(response, user.email, currentVersions);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message === "email_exists") {
        return NextResponse.json(
          {
            error:
              "Registration could not be completed. If you already have an account, please sign in.",
          },
          { status: 400 }
        );
      }
      console.error("Manual registration failed:", error);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}