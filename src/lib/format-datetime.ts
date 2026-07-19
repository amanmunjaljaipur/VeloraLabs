const INTL_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function formatSiteDateTime(value: string | null | undefined): string {
  if (!value) return " - ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", INTL_OPTIONS);
}