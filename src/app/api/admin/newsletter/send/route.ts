import { auth } from "@/auth";
import { loadNewsletterDraft, sendNewsletterDraft } from "@/lib/newsletter-draft";
import { isTransactionalEmailConfigured } from "@/lib/send-email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const draft = await loadNewsletterDraft();
  if (!draft || draft.status === "sent") {
    return NextResponse.json(
      { error: "No newsletter draft to send. Create one first." },
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
        publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
      },
      email: {
        subscriberCount: email.subscriberCount,
        sentCount: email.sentCount,
        failedCount: email.failedCount,
        pdfFilename: email.pdfFilename,
        configured: isTransactionalEmailConfigured(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}