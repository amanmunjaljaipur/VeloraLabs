import { verifyUnsubscribeToken } from "@/lib/marketing/campaign-sender";
import { addSuppression } from "@/lib/marketing/suppression-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Public, unauthenticated - clicked directly from an email footer. Token is an HMAC, not a secret to protect. */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim() ?? "";
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse("Invalid or expired unsubscribe link.", { status: 400 });
  }

  await addSuppression(email, "unsubscribed");

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Unsubscribed</title>
    <style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1f2937}</style>
    </head><body><h1>You're unsubscribed</h1><p>${email} will not receive further emails from Verlin Labs. If this was a mistake, contact us to resubscribe.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
