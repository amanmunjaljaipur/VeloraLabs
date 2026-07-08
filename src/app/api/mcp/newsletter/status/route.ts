import { getConfiguredFromPreview, getEmailProvider, isTransactionalEmailConfigured } from "@/lib/send-email";
import { loadNewsletterDraft } from "@/lib/newsletter-draft";
import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { getNewsletterSubscriberEmails } from "@/lib/newsletter-subscribers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const draft = await loadNewsletterDraft();
  const subscribers = await getNewsletterSubscriberEmails();

  return NextResponse.json({
    success: true,
    email: {
      configured: isTransactionalEmailConfigured(),
      provider: getEmailProvider(),
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      fromAddress: getConfiguredFromPreview(),
    },
    subscribers: {
      count: subscribers.length,
    },
    draft: draft
      ? {
          id: draft.id,
          title: draft.title,
          storyCount: draft.stories.length,
          status: draft.status,
          updatedAt: draft.updatedAt,
        }
      : null,
  });
}