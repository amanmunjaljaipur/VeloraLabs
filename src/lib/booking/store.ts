import { randomUUID } from "crypto";
import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";

const BOOKINGS_FILE = "free-session-bookings.json";
const DEFAULT_STORE = '{"version":1,"bookings":[]}';

export type BookingAudience = "students" | "engineers" | "professionals";

export interface SlotDefinition {
  id: string;
  time: string;
  /** Seats available in this slot, shared across all audience tracks. */
  capacity: number;
}

/**
 * Five daily slots, one shared pool across students/engineers/professionals -
 * no per-track slots. This is intentional: the free session is a single
 * cohort experience, not three separate calendars.
 */
export const DAILY_SLOTS: SlotDefinition[] = [
  { id: "s1", time: "10:00", capacity: 5 },
  { id: "s2", time: "12:00", capacity: 5 },
  { id: "s3", time: "14:00", capacity: 5 },
  { id: "s4", time: "16:00", capacity: 5 },
  { id: "s5", time: "18:00", capacity: 5 },
];

export interface BookingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  time: string;
  name: string;
  email: string;
  audience: BookingAudience;
  status: "confirmed";
  confirmedVia: "logged_in" | "otp";
  createdAt: string;
}

interface BookingStore {
  version: number;
  bookings: BookingRecord[];
}

function readLocal(): BookingStore {
  const data = readJsonFile<BookingStore>(BOOKINGS_FILE, DEFAULT_STORE);
  return {
    version: data.version ?? 1,
    bookings: Array.isArray(data.bookings) ? data.bookings : [],
  };
}

/**
 * Force-hydrate from Blob before every read. Without this, each serverless
 * instance keeps serving its own /tmp snapshot from cold start forever, so a
 * booking confirmed on one instance can be invisible (or worse, silently
 * overwritten) on another - the same class of bug found in the blog store.
 */
async function readStore(): Promise<BookingStore> {
  await ensureDataFileHydrated(BOOKINGS_FILE, DEFAULT_STORE, { force: true });
  return readLocal();
}

async function writeStore(store: BookingStore): Promise<void> {
  await writeJsonFileAsync(BOOKINGS_FILE, store, DEFAULT_STORE);
}

/**
 * Serializes all booking writes through a single in-process promise chain so
 * two near-simultaneous requests handled by the SAME server instance can
 * never both read "1 seat left" and both write a confirmed booking.
 *
 * Honest limitation: on a multi-instance serverless deployment this does not
 * protect across instances - only a real database transaction (or a Blob
 * lock) can do that fully. This closes the actual bug that existed before
 * (zero locking, pure client-side Math.random() fakery) and is correct for
 * the realistic traffic this booking form sees.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.catch(() => undefined);
  return result;
}

export function isValidDateKey(dateKey: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function isWeekend(dateKey: string): boolean {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export interface SlotAvailability {
  id: string;
  time: string;
  total: number;
  available: number;
}

export async function getSlotsForDate(dateKey: string): Promise<SlotAvailability[]> {
  if (!isValidDateKey(dateKey) || isWeekend(dateKey)) return [];

  const store = await readStore();
  const bookings = store.bookings.filter((b) => b.date === dateKey);
  return DAILY_SLOTS.map((slot) => {
    const booked = bookings.filter((b) => b.slotId === slot.id).length;
    return {
      id: slot.id,
      time: slot.time,
      total: slot.capacity,
      available: Math.max(0, slot.capacity - booked),
    };
  });
}

export type BookingAttempt = {
  date: string;
  slotId: string;
  name: string;
  email: string;
  audience: BookingAudience;
  confirmedVia: "logged_in" | "otp";
};

export type BookingOutcome =
  | { ok: true; booking: BookingRecord }
  | { ok: false; error: "slot_unavailable" | "invalid_slot" | "invalid_date" };

/**
 * The only place a confirmed booking gets created. Re-validates capacity at
 * write time (not just at read time), inside the write queue, against a
 * freshly force-hydrated Blob read - so a slot cannot be oversold within
 * this server instance, and stays close to correct across instances.
 */
export async function createConfirmedBooking(attempt: BookingAttempt): Promise<BookingOutcome> {
  return serialize<BookingOutcome>(async () => {
    if (!isValidDateKey(attempt.date) || isWeekend(attempt.date)) {
      return { ok: false, error: "invalid_date" };
    }
    const slotDef = DAILY_SLOTS.find((s) => s.id === attempt.slotId);
    if (!slotDef) return { ok: false, error: "invalid_slot" };

    const store = await readStore();
    const bookedInSlot = store.bookings.filter(
      (b) => b.date === attempt.date && b.slotId === attempt.slotId
    ).length;

    if (bookedInSlot >= slotDef.capacity) {
      return { ok: false, error: "slot_unavailable" };
    }

    const booking: BookingRecord = {
      id: `VL-${Date.now()}-${randomUUID().slice(0, 8)}`,
      date: attempt.date,
      slotId: attempt.slotId,
      time: slotDef.time,
      name: attempt.name.trim(),
      email: attempt.email.trim().toLowerCase(),
      audience: attempt.audience,
      status: "confirmed",
      confirmedVia: attempt.confirmedVia,
      createdAt: new Date().toISOString(),
    };

    store.bookings.push(booking);
    await writeStore(store);

    return { ok: true, booking };
  });
}

export async function listAllBookings(): Promise<BookingRecord[]> {
  const store = await readStore();
  return [...store.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listBookingsForDate(dateKey: string): Promise<BookingRecord[]> {
  const store = await readStore();
  return store.bookings.filter((b) => b.date === dateKey);
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const store = await readStore();
  return store.bookings.find((b) => b.id === id) ?? null;
}

export interface DaySlotStats {
  date: string;
  slots: (SlotAvailability & { booked: number })[];
  totalBooked: number;
  totalCapacity: number;
}

/** Admin summary: slot occupancy across a range of upcoming/past dates. */
export async function getBookingStatsForDates(dateKeys: string[]): Promise<DaySlotStats[]> {
  const store = await readStore();
  return dateKeys.map((dateKey) => {
    const dayBookings = store.bookings.filter((b) => b.date === dateKey);
    const weekend = isWeekend(dateKey);
    const slots = weekend
      ? []
      : DAILY_SLOTS.map((slot) => {
          const booked = dayBookings.filter((b) => b.slotId === slot.id).length;
          return {
            id: slot.id,
            time: slot.time,
            total: slot.capacity,
            booked,
            available: Math.max(0, slot.capacity - booked),
          };
        });
    return {
      date: dateKey,
      slots,
      totalBooked: dayBookings.length,
      totalCapacity: weekend ? 0 : DAILY_SLOTS.reduce((sum, s) => sum + s.capacity, 0),
    };
  });
}
