import crypto from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import {
  compileNewsletterEdition,
  type CompiledNewsletter,
  type NewsUpdateItem,
} from "@/lib/newsletter-compile";
import { getWeekOfSunday } from "@/lib/news-week";

const NEWS_UPDATES_FILE = "news-updates.json";
const NEWSLETTER_EDITIONS_FILE = "newsletter-editions.json";

export interface NewsUpdateInput {
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category?: string;
  weekOf?: string;
}

export interface StoredNewsUpdate extends NewsUpdateItem {
  weekOf: string;
  status: "pending" | "published";
}

interface NewsUpdatesStore {
  items: StoredNewsUpdate[];
}

interface NewsletterEditionsStore {
  editions: CompiledNewsletter[];
}

function readLocalEditionsCached(): NewsletterEditionsStore {
  return readJsonFile<NewsletterEditionsStore>(NEWSLETTER_EDITIONS_FILE, '{"editions":[]}');
}

/**
 * Force a fresh Blob pull before reading. Required for the weekly-edition
 * dedupe check and the cron pipeline - a cold serverless instance must not
 * see an empty local cache and re-publish/re-email a week that's already
 * gone out from a different instance.
 */
async function readLocalEditionsHydrated(): Promise<NewsletterEditionsStore> {
  await ensureDataFileHydrated(NEWSLETTER_EDITIONS_FILE, '{"editions":[]}', { force: true });
  return readJsonFile<NewsletterEditionsStore>(NEWSLETTER_EDITIONS_FILE, '{"editions":[]}');
}

async function readLocalUpdatesHydrated(): Promise<NewsUpdatesStore> {
  await ensureDataFileHydrated(NEWS_UPDATES_FILE, '{"items":[]}', { force: true });
  return readJsonFile<NewsUpdatesStore>(NEWS_UPDATES_FILE, '{"items":[]}');
}

async function saveAllUpdates(items: StoredNewsUpdate[]): Promise<void> {
  await writeJsonFileAsync(NEWS_UPDATES_FILE, { items }, '{"items":[]}');
}

async function saveEdition(edition: CompiledNewsletter): Promise<void> {
  const local = await readLocalEditionsHydrated();
  const withoutDuplicate = local.editions.filter((e) => e.weekOf !== edition.weekOf);
  await writeJsonFileAsync(
    NEWSLETTER_EDITIONS_FILE,
    { editions: [edition, ...withoutDuplicate] },
    '{"editions":[]}'
  );
}

export async function ingestNewsUpdates(
  inputs: NewsUpdateInput[]
): Promise<StoredNewsUpdate[]> {
  const existing = (await readLocalUpdatesHydrated()).items;
  const created: StoredNewsUpdate[] = [];

  for (const input of inputs) {
    const item: StoredNewsUpdate = {
      id: `news-${crypto.randomUUID()}`,
      title: input.title.trim(),
      summary: input.summary.trim(),
      url: input.url?.trim(),
      source: input.source?.trim(),
      category: input.category?.trim(),
      submittedAt: new Date().toISOString(),
      weekOf: input.weekOf ?? getWeekOfSunday(),
      status: "pending",
    };
    created.push(item);
    existing.push(item);
  }

  await saveAllUpdates(existing);
  return created;
}

export async function listNewsUpdates(filters?: {
  weekOf?: string;
  status?: "pending" | "published";
}): Promise<StoredNewsUpdate[]> {
  let items = (await readLocalUpdatesHydrated()).items;
  if (filters?.weekOf) {
    items = items.filter((item) => item.weekOf === filters.weekOf);
  }
  if (filters?.status) {
    items = items.filter((item) => item.status === filters.status);
  }
  return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function publishWeeklyNewsletter(options?: {
  weekOf?: string;
  intro?: string;
}): Promise<CompiledNewsletter> {
  const weekOf = options?.weekOf ?? getWeekOfSunday();
  const existingEditions = (await readLocalEditionsHydrated()).editions;
  if (existingEditions.some((edition) => edition.weekOf === weekOf)) {
    throw new Error(`Newsletter already published for week of ${weekOf}`);
  }

  const all = (await readLocalUpdatesHydrated()).items;
  const pending = all.filter((item) => item.weekOf === weekOf && item.status === "pending");

  if (pending.length === 0) {
    throw new Error(`No pending news updates for week of ${weekOf}`);
  }

  const edition = compileNewsletterEdition(weekOf, pending, {
    intro: options?.intro,
  });

  const updated = all.map((item) =>
    item.weekOf === weekOf && item.status === "pending"
      ? { ...item, status: "published" as const }
      : item
  );
  await saveAllUpdates(updated);
  await saveEdition(edition);

  return edition;
}

function sortEditionsNewestFirst(editions: CompiledNewsletter[]): CompiledNewsletter[] {
  return [...editions].sort((a, b) => {
    const weekCompare = b.weekOf.localeCompare(a.weekOf);
    if (weekCompare !== 0) return weekCompare;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

/** Fast path for public pages - reads local cache only, may be briefly stale. */
export function listPublishedNewsletterEditionsCached(): CompiledNewsletter[] {
  return sortEditionsNewestFirst(readLocalEditionsCached().editions);
}

export function getLatestNewsletterEditionCached(): CompiledNewsletter | null {
  const editions = listPublishedNewsletterEditionsCached();
  return editions[0] ?? null;
}

export function getNewsletterEditionBySlugCached(slug: string): CompiledNewsletter | null {
  const editions = readLocalEditionsCached().editions;
  return editions.find((edition) => edition.slug === slug) ?? null;
}

/** Strongly-consistent (force-hydrated) - use for correctness checks like weekly dedupe. */
export async function listPublishedNewsletterEditions(): Promise<CompiledNewsletter[]> {
  return sortEditionsNewestFirst((await readLocalEditionsHydrated()).editions);
}

export async function getLatestNewsletterEdition(): Promise<CompiledNewsletter | null> {
  const editions = await listPublishedNewsletterEditions();
  return editions[0] ?? null;
}

export async function getNewsletterEditionBySlug(
  slug: string
): Promise<CompiledNewsletter | null> {
  const editions = (await readLocalEditionsHydrated()).editions;
  return editions.find((edition) => edition.slug === slug) ?? null;
}