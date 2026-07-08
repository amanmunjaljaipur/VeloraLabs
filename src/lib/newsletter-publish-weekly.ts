import { loadNewsletterDraft, sendNewsletterDraft } from "@/lib/newsletter-draft";
import { generateNewsletterDraftFromWeb } from "@/lib/newsletter-generator";
import { isTransactionalEmailConfigured } from "@/lib/send-email";

export interface PublishWeeklyResult {
  generated: boolean;
  edition: {
    title: string;
    slug: string;
    itemCount: number;
    publishedAt: string;
    publicUrl: string;
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

/** Generate a fresh draft (if needed) and publish + email the weekly newsletter. */
export async function publishWeeklyNewsletterViaMcp(): Promise<PublishWeeklyResult> {
  let draft = await loadNewsletterDraft();

  if (!draft || draft.status === "sent" || draft.stories.length === 0) {
    draft = await generateNewsletterDraftFromWeb();
  }

  const result = await sendNewsletterDraft(draft);
  const { edition, email } = result;

  return {
    generated: true,
    edition: {
      title: edition.title,
      slug: edition.slug,
      itemCount: edition.itemCount,
      publishedAt: edition.publishedAt,
      publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
    },
    email: {
      subscriberCount: email.subscriberCount,
      sentCount: email.sentCount,
      failedCount: email.failedCount,
      pdfFilename: email.pdfFilename,
      configured: isTransactionalEmailConfigured(),
      failedEmails: email.failedEmails,
    },
  };
}