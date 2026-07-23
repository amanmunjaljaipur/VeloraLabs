import {
  getLatestNewsletterEditionCached,
  listPublishedNewsletterEditions,
  listPublishedNewsletterEditionsCached,
} from "@/lib/news-updates";
import { getWeekOfSunday } from "@/lib/news-week";
import { loadNewsletterDraft, sendNewsletterDraft } from "@/lib/newsletter-draft";
import { generateNewsletterDraftFromWeb } from "@/lib/newsletter-generator";
import { isTransactionalEmailConfigured } from "@/lib/send-email";

export interface PublishWeeklyResult {
  generated: boolean;
  alreadyPublished: boolean;
  edition: {
    title: string;
    slug: string;
    itemCount: number;
    publishedAt: string;
    publicUrl: string;
    weekOf: string;
  };
  email: {
    subscriberCount: number;
    sentCount: number;
    failedCount: number;
    pdfFilename: string;
    configured: boolean;
    failedEmails: string[];
  };
}

function editionResult(
  edition: {
    title: string;
    slug: string;
    itemCount: number;
    publishedAt: string;
    weekOf: string;
  },
  opts: {
    generated: boolean;
    alreadyPublished: boolean;
    email?: PublishWeeklyResult["email"];
  }
): PublishWeeklyResult {
  return {
    generated: opts.generated,
    alreadyPublished: opts.alreadyPublished,
    edition: {
      title: edition.title,
      slug: edition.slug,
      itemCount: edition.itemCount,
      publishedAt: edition.publishedAt,
      publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
      weekOf: edition.weekOf,
    },
    email: opts.email ?? {
      subscriberCount: 0,
      sentCount: 0,
      failedCount: 0,
      pdfFilename: "",
      configured: isTransactionalEmailConfigured(),
      failedEmails: [],
    },
  };
}

/**
 * Full weekly pipeline for cron / MCP:
 * 1. If this IST week already has an edition → no-op success (idempotent)
 * 2. Else generate draft from AI news RSS (if needed)
 * 3. Publish edition + email subscribers
 */
export async function publishWeeklyNewsletterViaMcp(): Promise<PublishWeeklyResult> {
  const weekOf = getWeekOfSunday();
  // Strongly-consistent read - a cold cron instance must see editions
  // published by other instances, not an empty local cache.
  const existing = (await listPublishedNewsletterEditions()).find((e) => e.weekOf === weekOf);
  if (existing) {
    return editionResult(existing, { generated: false, alreadyPublished: true });
  }

  let draft = await loadNewsletterDraft();

  // Always refresh content for a new week (stale/sent drafts are regenerated)
  if (!draft || draft.status === "sent" || draft.stories.length === 0) {
    draft = await generateNewsletterDraftFromWeb();
  }

  const result = await sendNewsletterDraft(draft);
  const { edition, email } = result;

  return editionResult(
    {
      title: edition.title,
      slug: edition.slug,
      itemCount: edition.itemCount,
      publishedAt: edition.publishedAt,
      weekOf: edition.weekOf,
    },
    {
      generated: true,
      alreadyPublished: false,
      email: {
        subscriberCount: email.subscriberCount,
        sentCount: email.sentCount,
        failedCount: email.failedCount,
        pdfFilename: email.pdfFilename,
        configured: isTransactionalEmailConfigured(),
        failedEmails: email.failedEmails,
      },
    }
  );
}

/** Status helper for admin / health checks */
export function getWeeklyNewsletterStatus() {
  const weekOf = getWeekOfSunday();
  const latest = getLatestNewsletterEditionCached();
  const thisWeek = listPublishedNewsletterEditionsCached().find((e) => e.weekOf === weekOf);
  return {
    weekOf,
    publishedThisWeek: Boolean(thisWeek),
    thisWeekEdition: thisWeek
      ? {
          slug: thisWeek.slug,
          title: thisWeek.title,
          publishedAt: thisWeek.publishedAt,
          publicUrl: `/newsletter/weekly?edition=${thisWeek.slug}`,
        }
      : null,
    latestEdition: latest
      ? {
          slug: latest.slug,
          title: latest.title,
          weekOf: latest.weekOf,
          publishedAt: latest.publishedAt,
        }
      : null,
    emailConfigured: isTransactionalEmailConfigured(),
  };
}
