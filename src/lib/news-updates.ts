import crypto from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";
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

function readLocalUpdates(): NewsUpdatesStore {
  return readJsonFile<NewsUpdatesStore>(NEWS_UPDATES_FILE, '{"items":[]}');
}

function writeLocalUpdates(store: NewsUpdatesStore): void {
  writeJsonFile(NEWS_UPDATES_FILE, store, '{"items":[]}');
}

function readLocalEditions(): NewsletterEditionsStore {
  return readJsonFile<NewsletterEditionsStore>(NEWSLETTER_EDITIONS_FILE, '{"editions":[]}');
}

function writeLocalEditions(store: NewsletterEditionsStore): void {
  writeJsonFile(NEWSLETTER_EDITIONS_FILE, store, '{"editions":[]}');
}

function loadAllUpdates(): StoredNewsUpdate[] {
  return readLocalUpdates().items;
}

function saveAllUpdates(items: StoredNewsUpdate[]): void {
  writeLocalUpdates({ items });
}

function loadAllEditions(): CompiledNewsletter[] {
  return readLocalEditions().editions;
}

function saveEdition(edition: CompiledNewsletter): void {
  const local = readLocalEditions();
  const withoutDuplicate = local.editions.filter((e) => e.weekOf !== edition.weekOf);
  writeLocalEditions({ editions: [edition, ...withoutDuplicate] });
}

export async function ingestNewsUpdates(
  inputs: NewsUpdateInput[]
): Promise<StoredNewsUpdate[]> {
  const existing = loadAllUpdates();
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

  saveAllUpdates(existing);
  return created;
}

export async function listNewsUpdates(filters?: {
  weekOf?: string;
  status?: "pending" | "published";
}): Promise<StoredNewsUpdate[]> {
  let items = loadAllUpdates();
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
  const existingEditions = loadAllEditions();
  if (existingEditions.some((edition) => edition.weekOf === weekOf)) {
    throw new Error(`Newsletter already published for week of ${weekOf}`);
  }

  const all = loadAllUpdates();
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
  saveAllUpdates(updated);
  saveEdition(edition);

  return edition;
}

function sortEditionsNewestFirst(editions: CompiledNewsletter[]): CompiledNewsletter[] {
  return [...editions].sort((a, b) => {
    const weekCompare = b.weekOf.localeCompare(a.weekOf);
    if (weekCompare !== 0) return weekCompare;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

/** Fast path for public pages - reads local cache only. */
export function listPublishedNewsletterEditionsCached(): CompiledNewsletter[] {
  return sortEditionsNewestFirst(readLocalEditions().editions);
}

export function getLatestNewsletterEditionCached(): CompiledNewsletter | null {
  const editions = listPublishedNewsletterEditionsCached();
  return editions[0] ?? null;
}

export function getNewsletterEditionBySlugCached(slug: string): CompiledNewsletter | null {
  const editions = readLocalEditions().editions;
  return editions.find((edition) => edition.slug === slug) ?? null;
}

export async function listPublishedNewsletterEditions(): Promise<CompiledNewsletter[]> {
  return sortEditionsNewestFirst(loadAllEditions());
}

export async function getLatestNewsletterEdition(): Promise<CompiledNewsletter | null> {
  const editions = await listPublishedNewsletterEditions();
  return editions[0] ?? null;
}

export async function getNewsletterEditionBySlug(
  slug: string
): Promise<CompiledNewsletter | null> {
  const editions = loadAllEditions();
  return editions.find((edition) => edition.slug === slug) ?? null;
}