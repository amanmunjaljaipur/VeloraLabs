import { auth } from "@/auth";
import { sendBookingConfirmationEmail } from "@/lib/booking/email";
import { createConfirmedBooking, type BookingAudience } from "@/lib/booking/store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().min(1),
  audience: z.enum(["students", "engineers", "professionals"]),
});

/** Logged-in booking path - session is already proof of identity, so we book and email directly, no OTP. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`booking-confirm:${ip}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts, please try again shortly" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = session.user.name?.trim() || session.user.email.split("@")[0];
  const email = session.user.email;
  const { date, slotId, audience } = parsed.data;

  const outcome = await createConfirmedBooking({
    date,
    slotId,
    name,
    email,
    audience: audience as BookingAudience,
    confirmedVia: "logged_in",
    // Booking audience doubles as the slot category (students/engineers/
    // professionals each have their own pool, falling back to "free").
    category: audience as BookingAudience,
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
    audience: audience as BookingAudience,
    bookingId: outcome.booking.id,
  }).catch((error) => {
    console.error("Failed to send booking confirmation email:", error);
  });

  return NextResponse.json({ booking: outcome.booking });
}
