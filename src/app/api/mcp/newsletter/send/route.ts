import { loadNewsletterDraft, sendNewsletterDraft } from "@/lib/newsletter-draft";
import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const draft = await loadNewsletterDraft();
  if (!draft || draft.status === "sent") {
    return NextResponse.json(
      { error: "No newsletter draft to send. Generate one first." },
      { status: 409 }
    );
  }

  if (draft.stories.length === 0) {
    return NextResponse.json({ error: "Draft has no stories." }, { status: 400 });
  }

  try {
    const result = await sendNewsletterDraft(draft);
    const { edition, email } = result;

    return NextResponse.json({
      success: true,
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
        configured: Boolean(process.env.RESEND_API_KEY),
        failedEmails: email.failedEmails,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}