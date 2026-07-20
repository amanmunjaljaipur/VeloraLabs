import { randomUUID } from "crypto";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const ORGANIZER_EMAIL = "contact@verlinlabs.com";

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Folds long lines per RFC 5545 (75 octets, continuation lines start with a space). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

export interface BookingIcsInput {
  bookingId: string;
  /** YYYY-MM-DD, interpreted as India Standard Time wall-clock. */
  date: string;
  /** HH:MM, IST wall-clock. */
  time: string;
  attendeeName: string;
  attendeeEmail: string;
}

/**
 * Builds a real calendar invite (METHOD:REQUEST + ORGANIZER + ATTENDEE),
 * the same shape Gmail/Outlook/Apple Mail recognize to show an inline
 * "Add to Calendar / Yes / No" widget on the email itself - not just a
 * downloadable .ics file. Slot times are IST; converted to UTC correctly
 * (the old client-only version stamped local wall-clock with a bare "Z",
 * which is wrong).
 */
export function buildBookingIcs(input: BookingIcsInput): Buffer {
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time.split(":").map(Number);

  const startUtcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS;
  const start = new Date(startUtcMs);
  const end = new Date(startUtcMs + SESSION_DURATION_MS);
  const now = new Date();

  const uid = `${input.bookingId}@verlinlabs.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verlin Labs//Free Session Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SEQUENCE:0`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    foldLine(`SUMMARY:${escapeIcsText("Verlin Labs - Free 2-Hour AI Session")}`),
    foldLine(
      `DESCRIPTION:${escapeIcsText(
        `Your free live 2-hour AI session with Verlin Labs. The join link will be emailed to you closer to the session. Questions? Reply to this invite or email ${ORGANIZER_EMAIL}.`
      )}`
    ),
    "LOCATION:Online - link sent by email before the session",
    `ORGANIZER;CN=Verlin Labs:mailto:${ORGANIZER_EMAIL}`,
    foldLine(
      `ATTENDEE;CN=${escapeIcsText(input.attendeeName)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${input.attendeeEmail}`
    ),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Verlin Labs free session starts in 30 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return Buffer.from(lines.join("\r\n") + "\r\n", "utf8");
}

/** Human-readable IST time range, for use in email copy. */
export function formatIstRange(date: string, time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const endHour = (hour + 2) % 24;
  const fmt = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
  };
  return `${fmt(hour, minute)} - ${fmt(endHour, minute)} IST`;
}
