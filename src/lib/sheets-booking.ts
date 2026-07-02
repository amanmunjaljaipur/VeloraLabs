import { getAudiences } from "@/lib/content";

const AUDIENCE_LABELS: Record<string, string> = {
  students: "School Students (Classes 6–12)",
  engineers: "College Engineers",
  professionals: "Professionals",
};

export const FREE_SESSION_TITLE = "Free 2-Hour Introductory Session";
export const FREE_SESSION_DURATION = "2 hours";

export function resolveAudienceLabel(audience: string): string {
  const fromSelect = AUDIENCE_LABELS[audience];
  if (fromSelect) return fromSelect;

  const match = getAudiences().find((a) => a.slug === audience);
  return match?.shortTitle || audience;
}

export function enrichBookingPayload(data: {
  name: string;
  email: string;
  audience: string;
  date: string;
  time: string;
  bookingId?: string;
  timezone?: string;
}) {
  return {
    type: "booking" as const,
    name: data.name,
    email: data.email,
    audience: data.audience,
    audienceLabel: resolveAudienceLabel(data.audience),
    sessionTitle: FREE_SESSION_TITLE,
    sessionDuration: FREE_SESSION_DURATION,
    date: data.date,
    time: data.time,
    timezone: data.timezone || "Asia/Kolkata",
    status: "Confirmed",
    source: "Website",
    bookingId: data.bookingId || "",
  };
}