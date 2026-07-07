export const NEWSLETTER_TIMEZONE = "Asia/Kolkata";

function formatISODateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().split("T")[0]!;
  }

  return `${year}-${month}-${day}`;
}

function getWeekdayInTimeZone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
}

/** Returns the ISO date (YYYY-MM-DD) of the Sunday ending the IST week containing `date`. */
export function getWeekOfSunday(date = new Date()): string {
  let cursor = new Date(date);

  for (let i = 0; i < 7; i++) {
    if (getWeekdayInTimeZone(cursor, NEWSLETTER_TIMEZONE) === 0) {
      return formatISODateInTimeZone(cursor, NEWSLETTER_TIMEZONE);
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return formatISODateInTimeZone(date, NEWSLETTER_TIMEZONE);
}

export function formatWeekLabel(weekOf: string): string {
  const [year, month, day] = weekOf.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 6, 30, 0));

  return anchor.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: NEWSLETTER_TIMEZONE,
  });
}

export function formatWeekHeading(weekOf: string): string {
  return `Week ending ${formatWeekLabel(weekOf)}`;
}

export function editionSlug(weekOf: string, suffix?: string): string {
  return suffix ? `week-of-${weekOf}-${suffix}` : `week-of-${weekOf}`;
}