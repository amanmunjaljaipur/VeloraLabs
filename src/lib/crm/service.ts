import { ensureKnownUsersLoaded } from "@/lib/known-users";
import {
  isServiceAccountConfigured,
  readBookingRowsFromSheet,
  readContactRowsFromSheet,
  readNewsletterSubscriberRowsFromSheet,
} from "@/lib/google-sheets-service";
import { readJsonFile } from "@/lib/data-store";
import { ensureRolesLoaded, getRoleForEmail } from "@/lib/roles";
import { ROLE_LABELS } from "@/types/roles";

export interface CrmBookingLead {
  id: string;
  timestamp: string;
  bookingId: string;
  status: string;
  name: string;
  email: string;
  audience: string;
  audienceLabel: string;
  sessionTitle: string;
  date: string;
  time: string;
  timezone: string;
  source: string;
}

export interface CrmContactLead {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  message: string;
  source: string;
}

export interface CrmSubscriber {
  email: string;
  source: string;
  subscribedAt: string;
}

export interface CrmPerson {
  email: string;
  name: string | null;
  role: string;
  roleLabel: string;
  provider: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  isSubscriber: boolean;
}

export interface CrmDashboardData {
  sheetsConnected: boolean;
  bookings: CrmBookingLead[];
  contacts: CrmContactLead[];
  subscribers: CrmSubscriber[];
  people: CrmPerson[];
  stats: {
    bookings: number;
    contacts: number;
    subscribers: number;
    people: number;
  };
}

export async function loadCrmDashboard(): Promise<CrmDashboardData> {
  const sheetsConnected = isServiceAccountConfigured();

  let bookings: CrmBookingLead[] = [];
  let contacts: CrmContactLead[] = [];

  if (sheetsConnected) {
    try {
      bookings = (await readBookingRowsFromSheet()).map((row, index) => ({
        id: row.bookingId || `booking-${index}`,
        ...row,
      }));
    } catch (error) {
      console.error("CRM booking load failed:", error);
    }

    try {
      contacts = (await readContactRowsFromSheet()).map((row, index) => ({
        id: `contact-${row.timestamp}-${index}`,
        ...row,
      }));
    } catch (error) {
      console.error("CRM contact load failed:", error);
    }
  }

  const subscriberMap = new Map<string, CrmSubscriber>();

  const localSubs = readJsonFile<{ subscribers: Record<string, CrmSubscriber> }>(
    "newsletter-subscribers.json",
    '{"subscribers":{}}'
  );
  for (const sub of Object.values(localSubs.subscribers)) {
    subscriberMap.set(sub.email, sub);
  }

  if (sheetsConnected) {
    try {
      const sheetSubs = await readNewsletterSubscriberRowsFromSheet();
      for (const row of sheetSubs) {
        if (!subscriberMap.has(row.email)) {
          subscriberMap.set(row.email, row);
        }
      }
    } catch (error) {
      console.error("CRM subscriber load failed:", error);
    }
  }

  const subscribers = [...subscriberMap.values()].sort((a, b) =>
    b.subscribedAt.localeCompare(a.subscribedAt)
  );

  await ensureKnownUsersLoaded();
  await ensureRolesLoaded();

  const knownUsers = readJsonFile<
    Record<string, { email: string; name: string | null; provider: string; firstSeenAt: string; lastSeenAt: string }>
  >("known-users.json", "{}");

  const people: CrmPerson[] = Object.values(knownUsers)
    .map((user) => {
      const role = getRoleForEmail(user.email);
      return {
        email: user.email,
        name: user.name,
        role,
        roleLabel: ROLE_LABELS[role],
        provider: user.provider ?? null,
        firstSeenAt: user.firstSeenAt ?? null,
        lastSeenAt: user.lastSeenAt ?? null,
        isSubscriber: subscriberMap.has(user.email),
      };
    })
    .sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));

  return {
    sheetsConnected,
    bookings,
    contacts,
    subscribers,
    people,
    stats: {
      bookings: bookings.length,
      contacts: contacts.length,
      subscribers: subscribers.length,
      people: people.length,
    },
  };
}