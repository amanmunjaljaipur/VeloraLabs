import { CONTACT_EMAIL } from "@/lib/brand-email";
import type { CompiledNewsletter } from "@/lib/newsletter-compile";
import { generateNewsletterPdf, newsletterPdfFilename } from "@/lib/newsletter-pdf";
import type { NewsletterDraftContent } from "@/lib/newsletter-rich-compile";
import { getNewsletterSubscriberEmails } from "@/lib/newsletter-subscribers";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/send-email";

export interface NewsletterEmailDeliveryResult {
  subscriberCount: number;
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
  pdfFilename: string;
}

function getPublicBaseUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function buildEmailHtml(edition: CompiledNewsletter, publicUrl: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; max-width: 640px; margin: 0 auto;">
      <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #0d9488; font-weight: 600;">
        Verlin Labs Newsletter
      </p>
      <h1 style="font-size: 28px; line-height: 1.2; margin: 12px 0 16px;">${edition.title}</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">${edition.intro}</p>
      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Your PDF edition is attached. It includes ${edition.itemCount} AI stories with clarity lenses and mental-model framing.
      </p>
      <p style="margin-top: 28px;">
        <a href="${publicUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
          Read online
        </a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
        You receive this because you subscribed to the Verlin Labs newsletter. Reply to ${CONTACT_EMAIL} to unsubscribe.
      </p>
    </div>
  `;
}

async function sendSingleNewsletterEmail(options: {
  to: string;
  edition: CompiledNewsletter;
  pdfBuffer: Buffer;
  pdfFilename: string;
  publicUrl: string;
}): Promise<boolean> {
  return sendTransactionalEmail({
    to: options.to,
    subject: options.edition.title,
    html: buildEmailHtml(options.edition, options.publicUrl),
    from: process.env.NEWSLETTER_FROM_EMAIL,
    attachments: [
      {
        filename: options.pdfFilename,
        content: options.pdfBuffer,
      },
    ],
  });
}

export async function deliverNewsletterByEmail(
  draft: NewsletterDraftContent,
  edition: CompiledNewsletter
): Promise<NewsletterEmailDeliveryResult> {
  const subscribers = await getNewsletterSubscriberEmails();
  const pdfBuffer = await generateNewsletterPdf(draft);
  const pdfFilename = newsletterPdfFilename(draft);
  const publicUrl = `${getPublicBaseUrl()}/newsletter/weekly?edition=${edition.slug}`;

  if (!isTransactionalEmailConfigured()) {
    return {
      subscriberCount: subscribers.length,
      sentCount: 0,
      failedCount: subscribers.length,
      failedEmails: subscribers,
      pdfFilename,
    };
  }

  const failedEmails: string[] = [];
  let sentCount = 0;

  for (const email of subscribers) {
    const ok = await sendSingleNewsletterEmail({
      to: email,
      edition,
      pdfBuffer,
      pdfFilename,
      publicUrl,
    });
    if (ok) {
      sentCount += 1;
    } else {
      failedEmails.push(email);
    }
  }

  return {
    subscriberCount: subscribers.length,
    sentCount,
    failedCount: failedEmails.length,
    failedEmails,
    pdfFilename,
  };
}