"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CalendarCheck, Loader2, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SlotStat {
  id: string;
  time: string;
  total: number;
  booked: number;
  available: number;
}

interface DayStat {
  date: string;
  slots: SlotStat[];
  totalBooked: number;
  totalCapacity: number;
}

interface BookingRow {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  audience: "students" | "engineers" | "professionals";
  confirmedVia: "logged_in" | "otp";
  createdAt: string;
}

interface BookingsResponse {
  dailyCapacity: number;
  slotsPerDay: number;
  stats: DayStat[];
  bookings: BookingRow[];
  totalBookings: number;
}

const audienceLabels: Record<string, string> = {
  students: "Students",
  engineers: "Engineers",
  professionals: "Professionals",
};

function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BookingsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [audienceFilter, setAudienceFilter] = useState("all");

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/admin/bookings?days=14");
    if (!res.ok) {
      toast("Failed to load bookings", "error");
      return;
    }
    setData(await res.json());
  }, [toast]);

  useEffect(() => {
    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    if (audienceFilter === "all") return data.bookings;
    return data.bookings.filter((b) => b.audience === audienceFilter);
  }, [audienceFilter, data]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-2 py-16 text-sm text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading bookings…
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="py-16 text-center text-sm text-text-secondary">
        Could not load booking data.
      </Card>
    );
  }

  const next7 = data.stats.slice(0, 7);
  const totalBookedNext7 = next7.reduce((sum, d) => sum + d.totalBooked, 0);
  const totalCapacityNext7 = next7.reduce((sum, d) => sum + d.totalCapacity, 0);
  const fillRate = totalCapacityNext7 > 0 ? Math.round((totalBookedNext7 / totalCapacityNext7) * 100) : 0;

  return (
    <section className="container-verlin space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-semibold text-foreground">Free session bookings</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {data.slotsPerDay} slots/day, {data.dailyCapacity} seats/day - shared across students,
            engineers, and professionals.
          </p>
        </div>
      </div>

      {/* KPI summary row - frosted stat cards with animated counters. */}
      <MotionStagger className="grid gap-3 sm:grid-cols-3">
        <MotionStaggerItem>
          <Card variant="glass" className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Booked · next 7 days
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-teal">
              <CountUp value={String(totalBookedNext7)} /> <span className="text-lg text-text-secondary">/ {totalCapacityNext7}</span>
            </p>
          </Card>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <Card variant="glass" className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Fill rate · next 7 days
            </p>
            <p className="mt-2 flex items-center gap-2 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-foreground">
              <CountUp value={`${fillRate}%`} />
              <TrendingUp className="h-5 w-5 text-accent-teal" aria-hidden="true" />
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent-teal transition-[width] duration-700 ease-out"
                style={{ width: `${fillRate}%` }}
              />
            </div>
          </Card>
        </MotionStaggerItem>
        <MotionStaggerItem>
          <Card variant="glass" className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Total bookings (all time)
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-cta-amber">
              <CountUp value={String(data.totalBookings)} />
            </p>
          </Card>
        </MotionStaggerItem>
      </MotionStagger>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {next7.map((day) => {
          const dayFillRate = day.totalCapacity > 0 ? Math.round((day.totalBooked / day.totalCapacity) * 100) : 0;
          return (
            <Card key={day.date} className="p-4">
              <p className="text-sm font-semibold text-foreground">{formatDayLabel(day.date)}</p>
              {day.slots.length === 0 ? (
                <p className="mt-2 text-xs text-text-secondary">Weekend - no slots</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-text-secondary">
                    {day.totalBooked} / {day.totalCapacity} booked
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700 ease-out",
                        dayFillRate >= 100 ? "bg-red-500" : "bg-accent-teal"
                      )}
                      style={{ width: `${Math.min(100, dayFillRate)}%` }}
                    />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {day.slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{slot.time}</span>
                        <span
                          className={cn(
                            "font-medium",
                            slot.available === 0 ? "text-red-500" : "text-foreground"
                          )}
                        >
                          {slot.booked}/{slot.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "students", "engineers", "professionals"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAudienceFilter(value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              audienceFilter === value
                ? "bg-accent-teal text-white"
                : "bg-muted text-text-secondary hover:text-foreground"
            )}
          >
            {value === "all" ? "All tracks" : audienceLabels[value]}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="py-16 text-center text-sm text-text-secondary">
          No bookings match your filters.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{booking.name}</p>
                    <Badge variant="audience">{audienceLabels[booking.audience]}</Badge>
                    <Badge variant="audience">
                      {booking.confirmedVia === "logged_in" ? "Signed in" : "OTP verified"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{booking.email}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                    <Users className="h-3.5 w-3.5" />
                    {formatDayLabel(booking.date)} at {booking.time} · Booking {booking.id}
                  </p>
                </div>
                <time dateTime={booking.createdAt} className="text-xs text-text-secondary">
                  Booked {formatDateTime(booking.createdAt)}
                </time>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
