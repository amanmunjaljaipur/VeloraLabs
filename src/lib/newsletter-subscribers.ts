import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  appendNewsletterSubscriberToSheet,
  isServiceAccountConfigured,
  readNewsletterSubscriberRowsFromSheet,
} from "@/lib/google-sheets-service";
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

async function loadSheetSubscribers(): Promise<NewsletterSubscriber[]> {
  if (!isServiceAccountConfigured()) return [];
  try {
    const rows = await readNewsletterSubscriberRowsFromSheet();
    return rows.map((row) => ({
      email: normalizeEmail(row.email),
      source: row.source,
      subscribedAt: row.subscribedAt,
    }));
  } catch (error) {
    console.error("Failed to load newsletter subscribers from Sheets:", error);
    return [];
  }
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

  if (isServiceAccountConfigured()) {
    try {
      await appendNewsletterSubscriberToSheet(normalized, source);
    } catch (error) {
      console.error("Failed to persist newsletter subscriber to Sheets:", error);
    }
  }

  return record;
}

export async function getNewsletterSubscriberEmails(): Promise<string[]> {
  const emails = new Set<string>();

  for (const subscriber of Object.values(readLocalSubscribers().subscribers)) {
    emails.add(subscriber.email);
  }

  for (const row of await loadSheetSubscribers()) {
    emails.add(row.email);
  }

  return [...emails].sort();
}

export async function isNewsletterSubscriber(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  if (readLocalSubscribers().subscribers[normalized]) {
    return true;
  }

  const sheetRows = await loadSheetSubscribers();
  return sheetRows.some((row) => row.email === normalized);
}