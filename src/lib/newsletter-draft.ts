import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type { CompiledNewsletter } from "@/lib/newsletter-compile";
import {
  appendNewsletterEditionToSheet,
  isServiceAccountConfigured,
  persistNewsletterDraftToSheet,
  readNewsletterDraftFromSheet,
} from "@/lib/google-sheets-service";
import type { NewsletterDraftContent } from "@/lib/newsletter-rich-compile";
import { deliverNewsletterByEmail, type NewsletterEmailDeliveryResult } from "@/lib/newsletter-email";
import { getWeekOfSunday } from "@/lib/news-week";
import { draftToEditionSlug } from "@/lib/newsletter-rich-compile";

export type { NewsletterEmailDeliveryResult };

const DRAFT_FILE = "newsletter-draft.json";
const EDITIONS_FILE = "newsletter-editions.json";

interface DraftStore {
  draft: NewsletterDraftContent | null;
}

interface EditionsStore {
  editions: CompiledNewsletter[];
}

function readLocalDraft(): NewsletterDraftContent | null {
  return readJsonFile<DraftStore>(DRAFT_FILE, '{"draft":null}').draft;
}

function writeLocalDraft(draft: NewsletterDraftContent | null): void {
  writeJsonFile(DRAFT_FILE, { draft }, '{"draft":null}');
}

export async function loadNewsletterDraft(): Promise<NewsletterDraftContent | null> {
  if (isServiceAccountConfigured()) {
    try {
      const fromSheet = await readNewsletterDraftFromSheet();
      if (fromSheet) return fromSheet;
    } catch (error) {
      console.error("Failed to load newsletter draft from Sheets:", error);
    }
  }
  return readLocalDraft();
}

export async function saveNewsletterDraft(draft: NewsletterDraftContent): Promise<void> {
  writeLocalDraft(draft);
  if (isServiceAccountConfigured()) {
    await persistNewsletterDraftToSheet(draft);
  }
}

export async function clearNewsletterDraft(): Promise<void> {
  writeLocalDraft(null);
  if (isServiceAccountConfigured()) {
    await persistNewsletterDraftToSheet(null);
  }
}

export interface SendNewsletterResult {
  edition: CompiledNewsletter;
  email: NewsletterEmailDeliveryResult;
}

export async function sendNewsletterDraft(
  draft: NewsletterDraftContent
): Promise<SendNewsletterResult> {
  const weekOf = getWeekOfSunday();
  const slug = draftToEditionSlug(draft);
  const publishedAt = new Date().toISOString();

  const edition: CompiledNewsletter = {
    editionId: `edition-${slug}`,
    weekOf,
    slug,
    title: draft.title,
    intro: draft.intro,
    markdown: draft.markdown,
    html: draft.html,
    itemCount: draft.stories.length,
    publishedAt,
  };

  const local = readJsonFile<EditionsStore>(EDITIONS_FILE, '{"editions":[]}');
  writeJsonFile(EDITIONS_FILE, { editions: [edition, ...local.editions] }, '{"editions":[]}');

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

  const email = await deliverNewsletterByEmail(draft, edition);

  await saveNewsletterDraft({ ...draft, status: "sent", updatedAt: publishedAt });
  return { edition, email };
}