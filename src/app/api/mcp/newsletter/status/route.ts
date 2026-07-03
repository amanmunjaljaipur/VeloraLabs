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
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      fromAddress:
        process.env.NEWSLETTER_FROM_EMAIL ??
        process.env.RESEND_FROM_EMAIL ??
        "Verlin Labs <onboarding@resend.dev>",
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