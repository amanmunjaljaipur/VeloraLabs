import { signUpSchema } from "@/lib/auth-validation";
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

  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { firstName, lastName, email, password } = parsed.data;

    try {
      const user = await createManualUser({ firstName, lastName, email, password });
      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
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
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}