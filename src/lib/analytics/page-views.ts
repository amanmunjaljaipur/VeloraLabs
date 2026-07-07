import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const PAGE_VIEWS_FILE = "page-analytics.json";

interface PageDayBucket {
  total: number;
  byDay: Record<string, number>;
}

interface PageAnalyticsStore {
  version: number;
  updatedAt: string;
  pages: Record<string, PageDayBucket>;
}

const EMPTY: PageAnalyticsStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  pages: {},
};

function readStore(): PageAnalyticsStore {
  return readJsonFile<PageAnalyticsStore>(PAGE_VIEWS_FILE, JSON.stringify(EMPTY));
}

function writeStore(store: PageAnalyticsStore): void {
  store.updatedAt = new Date().toISOString();
  writeJsonFile(PAGE_VIEWS_FILE, store, JSON.stringify(EMPTY));
}

function normalizePath(path: string): string {
  const trimmed = path.split("?")[0]?.split("#")[0]?.trim() || "/";
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  if (trimmed.length > 1 && trimmed.endsWith("/")) return trimmed.slice(0, -1);
  return trimmed;
}

function istDayKey(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|wget|curl|python-requests/i;

export function recordPageView(path: string, userAgent = ""): void {
  if (BOT_PATTERN.test(userAgent)) return;

  const normalized = normalizePath(path);
  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/api") ||
    normalized.startsWith("/_next")
  ) {
    return;
  }

  const store = readStore();
  const day = istDayKey();
  const bucket = store.pages[normalized] ?? { total: 0, byDay: {} };

  bucket.total += 1;
  bucket.byDay[day] = (bucket.byDay[day] ?? 0) + 1;
  store.pages[normalized] = bucket;
  writeStore(store);
}

export interface PageViewSummary {
  totalViews: number;
  uniquePages: number;
  last7Days: number;
  last30Days: number;
  topPages: Array<{ path: string; views: number; last7Days: number }>;
  dailyTrend: Array<{ date: string; views: number }>;
}

function sumDays(byDay: Record<string, number>, days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  let total = 0;
  for (const [day, count] of Object.entries(byDay)) {
    const parsed = new Date(`${day}T00:00:00`);
    if (parsed >= cutoff) total += count;
  }
  return total;
}

export function getPageViewSummary(): PageViewSummary {
  const store = readStore();
  const entries = Object.entries(store.pages);

  const topPages = entries
    .map(([path, bucket]) => ({
      path,
      views: bucket.total,
      last7Days: sumDays(bucket.byDay, 7),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  const dailyMap = new Map<string, number>();
  for (const bucket of Object.values(store.pages)) {
    for (const [day, count] of Object.entries(bucket.byDay)) {
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + count);
    }
  }

  const dailyTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, views]) => ({ date, views }));

  const last7Days = entries.reduce((sum, [, bucket]) => sum + sumDays(bucket.byDay, 7), 0);
  const last30Days = entries.reduce((sum, [, bucket]) => sum + sumDays(bucket.byDay, 30), 0);

  return {
    totalViews: entries.reduce((sum, [, bucket]) => sum + bucket.total, 0),
    uniquePages: entries.length,
    last7Days,
    last30Days,
    topPages,
    dailyTrend,
  };
}