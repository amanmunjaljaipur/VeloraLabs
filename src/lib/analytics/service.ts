import { CMS_PAGES } from "@/lib/cms/registry";
import { loadCrmDashboard } from "@/lib/crm/service";
import { readTrainingDataset } from "@/lib/chat/training-store";
import { getAllVideoComments } from "@/lib/video-comments";
export interface CountBucket {
  label: string;
  count: number;
}

export interface RecentActivity {
  last7Days: {
    bookings: number;
    contacts: number;
    subscribers: number;
    signIns: number;
    videoComments: number;
  };
  last30Days: {
    bookings: number;
    contacts: number;
    subscribers: number;
    signIns: number;
    videoComments: number;
  };
}

export interface AnalyticsDashboardData {
  generatedAt: string;
  sheetsConnected: boolean;
  totals: {
    people: number;
    bookings: number;
    contacts: number;
    subscribers: number;
    videoComments: number;
    chatbotFaqs: number;
    cmsPages: number;
  };
  recent: RecentActivity;
  bookingsByAudience: CountBucket[];
  bookingsByStatus: CountBucket[];
  peopleByRole: CountBucket[];
  subscribersBySource: CountBucket[];
  chatbotByCategory: CountBucket[];
}

function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function countSince(dates: Array<string | null | undefined>, days: number): number {
  const cutoff = daysAgoMs(days);
  return dates.filter((value) => {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time >= cutoff;
  }).length;
}

function bucketCounts(
  items: Array<{ label: string }>,
  labelKey: (item: { label: string }) => string
): CountBucket[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const label = labelKey(item).trim() || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function loadAnalyticsDashboard(): Promise<AnalyticsDashboardData> {
  const crm = await loadCrmDashboard();
  const comments = getAllVideoComments();
  const training = readTrainingDataset();
  const enabledFaqs = training.entries.filter((entry) => entry.enabled);

  const bookingTimestamps = crm.bookings.map((row) => row.timestamp);
  const contactTimestamps = crm.contacts.map((row) => row.timestamp);
  const subscriberTimestamps = crm.subscribers.map((row) => row.subscribedAt);
  const signInTimestamps = crm.people.map((person) => person.lastSeenAt);
  const commentTimestamps = comments.map((comment) => comment.createdAt);

  return {
    generatedAt: new Date().toISOString(),
    sheetsConnected: crm.sheetsConnected,
    totals: {
      people: crm.stats.people,
      bookings: crm.stats.bookings,
      contacts: crm.stats.contacts,
      subscribers: crm.stats.subscribers,
      videoComments: comments.length,
      chatbotFaqs: enabledFaqs.length,
      cmsPages: CMS_PAGES.length,
    },
    recent: {
      last7Days: {
        bookings: countSince(bookingTimestamps, 7),
        contacts: countSince(contactTimestamps, 7),
        subscribers: countSince(subscriberTimestamps, 7),
        signIns: countSince(signInTimestamps, 7),
        videoComments: countSince(commentTimestamps, 7),
      },
      last30Days: {
        bookings: countSince(bookingTimestamps, 30),
        contacts: countSince(contactTimestamps, 30),
        subscribers: countSince(subscriberTimestamps, 30),
        signIns: countSince(signInTimestamps, 30),
        videoComments: countSince(commentTimestamps, 30),
      },
    },
    bookingsByAudience: bucketCounts(
      crm.bookings.map((row) => ({ label: row.audienceLabel || row.audience || "Unknown" })),
      (row) => row.label
    ),
    bookingsByStatus: bucketCounts(
      crm.bookings.map((row) => ({ label: row.status || "Unknown" })),
      (row) => row.label
    ),
    peopleByRole: bucketCounts(
      crm.people.map((person) => ({ label: person.roleLabel || person.role })),
      (row) => row.label
    ),
    subscribersBySource: bucketCounts(
      crm.subscribers.map((row) => ({ label: row.source || "Unknown" })),
      (row) => row.label
    ),
    chatbotByCategory: bucketCounts(
      enabledFaqs.map((entry) => ({ label: entry.category })),
      (row) => row.label
    ),
  };
}