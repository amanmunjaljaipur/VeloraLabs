import type { CompiledNewsletter } from "@/lib/newsletter-compile";
import { generateNewsletterPdf, newsletterPdfFilename } from "@/lib/newsletter-pdf";
import type { NewsletterDraftContent } from "@/lib/newsletter-rich-compile";
import { getNewsletterSubscriberEmails } from "@/lib/newsletter-subscribers";

export interface NewsletterEmailDeliveryResult {
  subscriberCount: number;
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
  pdfFilename: string;
}

function getFromAddress(): string {
  if (process.env.NEWSLETTER_FROM_EMAIL) {
    return process.env.NEWSLETTER_FROM_EMAIL;
  }

  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (domain) {
    return `Verlin Labs <newsletter@${domain}>`;
  }

  return process.env.RESEND_FROM_EMAIL ?? "Verlin Labs <onboarding@resend.dev>";
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
        You receive this because you subscribe to Verlin Labs or signed in with an account.
      </p>
    </div>
  `;
}

async function sendSingleNewsletterEmail(options: {
  to: string;
  edition: CompiledNewsletter;
  draft: NewsletterDraftContent;
  pdfBuffer: Buffer;
  pdfFilename: string;
  publicUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [options.to],
      subject: options.edition.title,
      html: buildEmailHtml(options.edition, options.publicUrl),
      attachments: [
        {
          filename: options.pdfFilename,
          content: options.pdfBuffer.toString("base64"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Newsletter email failed for ${options.to}:`, body);
    return false;
  }

  return true;
}

export async function deliverNewsletterByEmail(
  draft: NewsletterDraftContent,
  edition: CompiledNewsletter
): Promise<NewsletterEmailDeliveryResult> {
  const subscribers = await getNewsletterSubscriberEmails();
  const pdfBuffer = await generateNewsletterPdf(draft);
  const pdfFilename = newsletterPdfFilename(draft);
  const publicUrl = `${getPublicBaseUrl()}/newsletter/weekly?edition=${edition.slug}`;

  if (!process.env.RESEND_API_KEY) {
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
      draft,
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