import { buildBookingIcs } from "@/lib/booking/ics";
import { getBookingById } from "@/lib/booking/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Fallback download for the "Add to Calendar" button on the confirmation
 * page (the primary invite is emailed as an attachment). Looks the booking
 * up by id rather than trusting query-string date/time/email, and reuses
 * the same timezone-correct generator as the email attachment.
 */
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId") ?? "";
  const booking = bookingId ? await getBookingById(bookingId) : null;

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const ics = buildBookingIcs({
    bookingId: booking.id,
    date: booking.date,
    time: booking.time,
    attendeeName: booking.name,
    attendeeEmail: booking.email,
  });

  // buildBookingIcs returns a Node Buffer; NextResponse needs a BodyInit,
  // so pass its bytes as a Uint8Array.
  const icsBytes = new Uint8Array(
    ics.buffer,
    ics.byteOffset,
    ics.byteLength
  );

  return new NextResponse(icsBytes, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="verlin-labs-free-session.ics"',
    },
  });
}
