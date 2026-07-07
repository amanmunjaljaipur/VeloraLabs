import crypto from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  appendNewsUpdateToSheet,
  appendNewsletterEditionToSheet,
  isServiceAccountConfigured,
  persistNewsUpdatesToSheet,
  readNewsletterEditionsFromSheet,
  readNewsUpdatesFromSheet,
  type NewsletterEditionSheetRow,
  type NewsUpdateSheetRow,
} from "@/lib/google-sheets-service";
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

function sheetRowToStored(row: NewsUpdateSheetRow): StoredNewsUpdate {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    url: row.url,
    source: row.source,
    category: row.category,
    submittedAt: row.submittedAt,
    weekOf: row.weekOf,
    status: row.status === "published" ? "published" : "pending",
  };
}

function storedToSheetRow(item: StoredNewsUpdate): NewsUpdateSheetRow {
  return {
    id: item.id,
    submittedAt: item.submittedAt,
    title: item.title,
    summary: item.summary,
    url: item.url,
    source: item.source,
    category: item.category,
    weekOf: item.weekOf,
    status: item.status,
  };
}

async function loadAllUpdates(): Promise<StoredNewsUpdate[]> {
  if (isServiceAccountConfigured()) {
    try {
      const rows = await readNewsUpdatesFromSheet();
      if (rows.length > 0) return rows.map(sheetRowToStored);
    } catch (error) {
      console.error("Failed to load news updates from Sheets:", error);
    }
  }
  return readLocalUpdates().items;
}

async function saveAllUpdates(items: StoredNewsUpdate[]): Promise<void> {
  writeLocalUpdates({ items });

  if (isServiceAccountConfigured()) {
    await persistNewsUpdatesToSheet(items.map(storedToSheetRow));
  }
}

async function loadAllEditions(): Promise<CompiledNewsletter[]> {
  if (isServiceAccountConfigured()) {
    try {
      const rows = await readNewsletterEditionsFromSheet();
      if (rows.length > 0) {
        return rows.map(sheetEditionToCompiled);
      }
    } catch (error) {
      console.error("Failed to load newsletter editions from Sheets:", error);
    }
  }
  return readLocalEditions().editions;
}

function sheetEditionToCompiled(row: NewsletterEditionSheetRow): CompiledNewsletter {
  return {
    editionId: row.editionId,
    weekOf: row.weekOf,
    slug: row.slug,
    title: row.title,
    intro: row.intro,
    markdown: row.markdown,
    html: row.html,
    itemCount: row.itemCount,
    publishedAt: row.publishedAt,
  };
}

async function saveEdition(edition: CompiledNewsletter): Promise<void> {
  const local = readLocalEditions();
  const withoutDuplicate = local.editions.filter((e) => e.weekOf !== edition.weekOf);
  writeLocalEditions({ editions: [edition, ...withoutDuplicate] });

  if (isServiceAccountConfigured()) {
    await appendNewsletterEditionToSheet({
      editionId: edition.editionId,
      weekOf: edition.weekOf,
      title: edition.title,
      publishedAt: edition.publishedAt,
      itemCount: edition.itemCount,
      intro: edition.intro,
      slug: edition.slug,
      markdown: edition.markdown,
      html: edition.html,
    });
  }
}

export async function ingestNewsUpdates(
  inputs: NewsUpdateInput[]
): Promise<StoredNewsUpdate[]> {
  const existing = await loadAllUpdates();
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

    if (isServiceAccountConfigured()) {
      await appendNewsUpdateToSheet(storedToSheetRow(item));
    }
  }

  if (!isServiceAccountConfigured()) {
    await saveAllUpdates(existing);
  }

  return created;
}

export async function listNewsUpdates(filters?: {
  weekOf?: string;
  status?: "pending" | "published";
}): Promise<StoredNewsUpdate[]> {
  let items = await loadAllUpdates();
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
  const existingEditions = await loadAllEditions();
  if (existingEditions.some((edition) => edition.weekOf === weekOf)) {
    throw new Error(`Newsletter already published for week of ${weekOf}`);
  }

  const all = await loadAllUpdates();
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

/** Fast path for public pages — reads local cache only (no Google Sheets round-trip). */
export function getLatestNewsletterEditionCached(): CompiledNewsletter | null {
  const editions = readLocalEditions().editions;
  if (editions.length === 0) return null;
  return editions.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
}

export function getNewsletterEditionBySlugCached(slug: string): CompiledNewsletter | null {
  const editions = readLocalEditions().editions;
  return editions.find((edition) => edition.slug === slug) ?? null;
}

export async function getLatestNewsletterEdition(): Promise<CompiledNewsletter | null> {
  const editions = await loadAllEditions();
  if (editions.length === 0) return null;
  return editions.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
}

export async function getNewsletterEditionBySlug(
  slug: string
): Promise<CompiledNewsletter | null> {
  const editions = await loadAllEditions();
  return editions.find((edition) => edition.slug === slug) ?? null;
}