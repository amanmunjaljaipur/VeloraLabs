import { createBookingOtpChallenge } from "@/lib/booking/otp-store";
import { sendBookingOtpEmail } from "@/lib/booking/email";
import { getSlotsForDate, isValidDateKey } from "@/lib/booking/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  audience: z.enum(["students", "engineers", "professionals"]),
});

/**
 * Logged-out booking, step 1: verify the slot still has room, then email a
 * one-time code. Nothing is booked or held here - the full intended booking
 * is stashed inside the OTP challenge and only written once the code is
 * confirmed (see /api/booking/otp/verify).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`booking-otp-request:${ip}`, 5, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts, please try again shortly" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { date, slotId, name, email, audience } = parsed.data;

  if (!isValidDateKey(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const slots = await getSlotsForDate(date);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  }
  if (slot.available <= 0) {
    return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
  }

  const emailRate = checkRateLimit(`booking-otp-request:${email.toLowerCase()}`, 3, 10 * 60 * 1000);
  if (!emailRate.allowed) {
    return NextResponse.json({ error: "Too many attempts, please try again shortly" }, { status: 429 });
  }

  const challenge = await createBookingOtpChallenge({ date, slotId, name, email, audience });

  const sent = await sendBookingOtpEmail({
    email,
    name,
    code: challenge.plainCode,
    date,
    time: slot.time,
  });

  if (!sent) {
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  return NextResponse.json({
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
  });
}
