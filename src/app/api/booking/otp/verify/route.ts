import { sendBookingConfirmationEmail } from "@/lib/booking/email";
import { verifyBookingOtp } from "@/lib/booking/otp-store";
import { createConfirmedBooking } from "@/lib/booking/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  challengeId: z.string().min(1),
  code: z.string().trim().min(4).max(12),
});

/**
 * Logged-out booking, step 2: confirm the code, then - and only then -
 * write the booking. This is the single moment capacity is actually
 * checked and consumed for the OTP path.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`booking-otp-verify:${ip}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts, please try again shortly" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await verifyBookingOtp(parsed.data.challengeId, parsed.data.code);
  if (!result.ok) {
    const status = result.error === "not_found" || result.error === "expired" ? 410 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const { date, slotId, name, email, audience } = result.payload;

  const outcome = await createConfirmedBooking({
    date,
    slotId,
    name,
    email,
    audience,
    confirmedVia: "otp",
    category: audience,
  });

  if (!outcome.ok) {
    const status = outcome.error === "slot_unavailable" ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  await sendBookingConfirmationEmail({
    email,
    name,
    date,
    time: outcome.booking.time,
    audience,
    bookingId: outcome.booking.id,
  }).catch((error) => {
    console.error("Failed to send booking confirmation email:", error);
  });

  return NextResponse.json({ booking: outcome.booking });
}
