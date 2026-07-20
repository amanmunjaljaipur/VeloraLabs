import { auth } from "@/auth";
import { getSlotsForDate, isValidDateKey } from "@/lib/booking/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Real slot availability - replaces the old mocked fetchSlots(). */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";

  if (!isValidDateKey(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const session = await auth();
  const slots = await getSlotsForDate(date);

  return NextResponse.json({
    date,
    slots,
    loggedIn: Boolean(session?.user),
  });
}
