/** Returns the ISO date (YYYY-MM-DD) of the Sunday ending the week containing `date`. */
export function getWeekOfSunday(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + daysUntilSunday);
  return d.toISOString().split("T")[0];
}

export function formatWeekLabel(weekOf: string): string {
  const sunday = new Date(`${weekOf}T12:00:00Z`);
  return sunday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function editionSlug(weekOf: string): string {
  return `week-of-${weekOf}`;
}