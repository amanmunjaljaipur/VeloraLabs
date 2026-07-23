import { auth } from "@/auth";
import { getSlotsForDate, isValidDateKey, type SlotCategory } from "@/lib/booking/store";
import { SLOT_CATEGORIES } from "@/lib/booking/slots-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_CATEGORIES = new Set(SLOT_CATEGORIES.map((c) => c.value));

/** Real slot availability - replaces the old mocked fetchSlots(). */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const audienceParam = req.nextUrl.searchParams.get("audience") ?? "free";
  const category: SlotCategory = VALID_CATEGORIES.has(audienceParam as SlotCategory)
    ? (audienceParam as SlotCategory)
    : "free";

  if (!isValidDateKey(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const session = await auth();
  const slots = await getSlotsForDate(date, category);

  return NextResponse.json({
    date,
    slots,
    loggedIn: Boolean(session?.user),
  });
}
