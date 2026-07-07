import { upsertLead } from "@/lib/crm/store";
import type { CrmSource, CrmStage } from "@/lib/crm/types";

export function ingestBookingLead(data: {
  name: string;
  email: string;
  audience: string;
  audienceLabel?: string;
  date: string;
  time: string;
  bookingId?: string;
  status?: string;
  source?: string;
  sessionTitle?: string;
}) {
  return upsertLead(
    {
      name: data.name,
      email: data.email,
      source: "free_session",
      stage: "session_booked" as CrmStage,
      audience: data.audience,
      audienceLabel: data.audienceLabel ?? data.audience,
      sessionDate: data.date,
      sessionTime: data.time,
      sessionTitle: data.sessionTitle ?? "Free 2-hour session",
      bookingId: data.bookingId ?? "",
      bookingStatus: data.status ?? "confirmed",
    },
    {
      activityType: "booking",
      activityBody: `Free session booked for ${data.date} ${data.time}`,
    }
  );
}

export function ingestContactLead(data: {
  name: string;
  email: string;
  message: string;
  source?: string;
}) {
  return upsertLead(
    {
      name: data.name,
      email: data.email,
      source: "contact_form",
      stage: "new",
      notes: data.message,
    },
    {
      activityType: "contact",
      activityBody: data.message.slice(0, 500),
    }
  );
}

export function ingestNewsletterLead(data: { email: string; source?: string }) {
  return upsertLead(
    {
      name: data.email.split("@")[0] ?? data.email,
      email: data.email,
      source: "newsletter" as CrmSource,
      stage: "new",
      isSubscriber: true,
    },
    {
      activityType: "newsletter",
      activityBody: `Subscribed via ${data.source ?? "newsletter"}`,
    }
  );
}