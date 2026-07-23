import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import type { CompiledNewsletter } from "@/lib/newsletter-compile";
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

// Force a fresh Blob pull before every read/write on this file - a cold
// serverless instance (e.g. the weekly cron) must not see a stale/empty
// local draft or duplicate an edition another instance already sent.
async function readLocalDraft(): Promise<NewsletterDraftContent | null> {
  await ensureDataFileHydrated(DRAFT_FILE, '{"draft":null}', { force: true });
  return readJsonFile<DraftStore>(DRAFT_FILE, '{"draft":null}').draft;
}

async function writeLocalDraft(draft: NewsletterDraftContent | null): Promise<void> {
  await writeJsonFileAsync(DRAFT_FILE, { draft }, '{"draft":null}');
}

export async function loadNewsletterDraft(): Promise<NewsletterDraftContent | null> {
  return readLocalDraft();
}

export async function saveNewsletterDraft(draft: NewsletterDraftContent): Promise<void> {
  await writeLocalDraft(draft);
}

export async function clearNewsletterDraft(): Promise<void> {
  await writeLocalDraft(null);
}

export interface SendNewsletterResult {
  edition: CompiledNewsletter;
  email: NewsletterEmailDeliveryResult;
}

export async function sendNewsletterDraft(
  draft: NewsletterDraftContent
): Promise<SendNewsletterResult> {
  const weekOf = getWeekOfSunday();
  await ensureDataFileHydrated(EDITIONS_FILE, '{"editions":[]}', { force: true });
  const local = readJsonFile<EditionsStore>(EDITIONS_FILE, '{"editions":[]}');

  // One edition per IST week - prevents double-posts from cron retries
  const existing = local.editions.find((e) => e.weekOf === weekOf);
  if (existing) {
    const email: NewsletterEmailDeliveryResult = {
      subscriberCount: 0,
      sentCount: 0,
      failedCount: 0,
      pdfFilename: "",
      failedEmails: [],
    };
    return { edition: existing, email };
  }

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

  await writeJsonFileAsync(
    EDITIONS_FILE,
    { editions: [edition, ...local.editions] },
    '{"editions":[]}'
  );

  const email = await deliverNewsletterByEmail(draft, edition);

  await saveNewsletterDraft({ ...draft, status: "sent", updatedAt: publishedAt });
  return { edition, email };
}