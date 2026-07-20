import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  DAILY_SLOTS,
  getBookingStatsForDates,
  listAllBookings,
} from "@/lib/booking/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

/** Slot occupancy + full booking list, for the super admin / admin bookings view. */
export async function GET(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rangeDays = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 14));
  const start = todayKey();
  const dateKeys = Array.from({ length: rangeDays }, (_, i) => addDays(start, i));

  const stats = await getBookingStatsForDates(dateKeys);
  const bookings = await listAllBookings();

  return NextResponse.json({
    dailyCapacity: DAILY_SLOTS.reduce((sum, s) => sum + s.capacity, 0),
    slotsPerDay: DAILY_SLOTS.length,
    stats,
    bookings,
    totalBookings: bookings.length,
  });
}
