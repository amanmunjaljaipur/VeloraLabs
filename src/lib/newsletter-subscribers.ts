import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const SUBSCRIBERS_FILE = "newsletter-subscribers.json";

export interface NewsletterSubscriber {
  email: string;
  source: string;
  subscribedAt: string;
}

interface SubscribersStore {
  subscribers: Record<string, NewsletterSubscriber>;
}

function readLocalSubscribers(): SubscribersStore {
  return readJsonFile<SubscribersStore>(SUBSCRIBERS_FILE, '{"subscribers":{}}');
}

function writeLocalSubscribers(store: SubscribersStore): void {
  writeJsonFile(SUBSCRIBERS_FILE, store, '{"subscribers":{}}');
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
  const local = readLocalSubscribers();

  if (local.subscribers[normalized]) {
    return local.subscribers[normalized];
  }

  const record: NewsletterSubscriber = {
    email: normalized,
    source,
    subscribedAt: now,
  };

  local.subscribers[normalized] = record;
  writeLocalSubscribers(local);

  return record;
}

export async function getNewsletterSubscriberEmails(): Promise<string[]> {
  return Object.values(readLocalSubscribers().subscribers)
    .map((subscriber) => subscriber.email)
    .sort();
}

export async function isNewsletterSubscriber(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  return Boolean(readLocalSubscribers().subscribers[normalized]);
}