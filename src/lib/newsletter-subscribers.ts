import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

const SUBSCRIBERS_FILE = "newsletter-subscribers.json";
const DEFAULT_CONTENT = '{"subscribers":{}}';

export interface NewsletterSubscriber {
  email: string;
  source: string;
  subscribedAt: string;
}

interface SubscribersStore {
  subscribers: Record<string, NewsletterSubscriber>;
}

/**
 * Always force a fresh Blob pull before reading. Vercel serverless instances
 * each get their own empty /tmp, and this file is never git-seeded (it's in
 * RUNTIME_DATA_FILES) - without forcing, a cold instance (e.g. the weekly
 * cron invocation) sees zero subscribers even though people have subscribed
 * on other instances. Same cross-instance caching bug fixed earlier for
 * blog/booking stores.
 */
async function readSubscribers(): Promise<SubscribersStore> {
  await ensureDataFileHydrated(SUBSCRIBERS_FILE, DEFAULT_CONTENT, { force: true });
  return readJsonFile<SubscribersStore>(SUBSCRIBERS_FILE, DEFAULT_CONTENT);
}

async function writeSubscribers(store: SubscribersStore): Promise<void> {
  // Await the Blob upload (not fire-and-forget) so a write is durable before
  // the request returns - matches AWAIT_BLOB_PERSIST_FILES for this file.
  await writeJsonFileAsync(SUBSCRIBERS_FILE, store, DEFAULT_CONTENT);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function ensureNewsletterSubscriber(
  email: string,
  source = "Signed-in user"
): Promise<NewsletterSubscriber | null> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return null;

  const now = new Date().toISOString();
  const store = await readSubscribers();

  if (store.subscribers[normalized]) {
    return store.subscribers[normalized];
  }

  const record: NewsletterSubscriber = {
    email: normalized,
    source,
    subscribedAt: now,
  };

  store.subscribers[normalized] = record;
  await writeSubscribers(store);

  return record;
}

export async function getNewsletterSubscriberEmails(): Promise<string[]> {
  const store = await readSubscribers();
  return Object.values(store.subscribers)
    .map((subscriber) => subscriber.email)
    .sort();
}

export async function isNewsletterSubscriber(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const store = await readSubscribers();
  return Boolean(store.subscribers[normalized]);
}
