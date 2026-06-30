export interface TimeSlot {
  id: string;
  time: string;
  available: number;
  total: number;
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  error?: "slot_unavailable" | "network_error";
}

const MOCK_SLOTS: Record<string, TimeSlot[]> = {
  default: [
    { id: "s1", time: "10:00", available: 3, total: 5 },
    { id: "s2", time: "12:00", available: 1, total: 5 },
    { id: "s3", time: "14:00", available: 4, total: 5 },
    { id: "s4", time: "16:00", available: 2, total: 5 },
    { id: "s5", time: "18:00", available: 0, total: 5 },
  ],
};

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export async function fetchSlots(date: Date): Promise<TimeSlot[]> {
  await new Promise((r) => setTimeout(r, 600));

  if (isWeekend(date)) return [];

  const apiKey = process.env.CALCOM_API_KEY;
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;

  if (apiKey && eventTypeId) {
    try {
      const start = getDateKey(date);
      const res = await fetch(
        `https://api.cal.com/v2/slots?eventTypeId=${eventTypeId}&startTime=${start}&endTime=${start}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.slots?.length) {
          return data.slots.map((s: { time: string }, i: number) => ({
            id: `cal-${i}`,
            time: s.time.slice(11, 16),
            available: Math.floor(Math.random() * 4) + 1,
            total: 5,
          }));
        }
      }
    } catch {
      // fall through to mock
    }
  }

  const slots = MOCK_SLOTS.default.map((s) => ({ ...s }));
  const dayOfMonth = date.getDate();
  if (dayOfMonth % 7 === 0) {
    return slots.map((s) => ({ ...s, available: 0 }));
  }
  return slots;
}

export async function createBooking(data: {
  name: string;
  email: string;
  date: string;
  slotId: string;
  audience: string;
}): Promise<BookingResult> {
  await new Promise((r) => setTimeout(r, 800));

  if (data.slotId === "s2" && Math.random() < 0.3) {
    return { success: false, error: "slot_unavailable" };
  }

  const apiKey = process.env.CALCOM_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.cal.com/v2/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTypeId: process.env.CALCOM_EVENT_TYPE_ID,
          start: data.date,
          attendee: { name: data.name, email: data.email },
          metadata: { audience: data.audience },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, bookingId: result.id };
      }
    } catch {
      return { success: false, error: "network_error" };
    }
  }

  return { success: true, bookingId: `VL-${Date.now()}` };
}

export function generateICS(date: string, time: string, name: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Velora Labs Free 2-Hour Session",
    `DESCRIPTION:Your free introductory session with Velora Labs. Attendee: ${name}`,
    "LOCATION:Online (link will be sent via email)",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}