import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isMailboxConfigured } from "@/lib/marketing/mailbox-client";
import { isTransactionalEmailConfigured } from "@/lib/send-email";
import { isEmailAiConfigured } from "@/lib/marketing/ai-email-assist";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Whether the Email Suite channel can read (IMAP) and/or send (SMTP/Resend). */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    inboxConfigured: isMailboxConfigured(),
    sendConfigured: isTransactionalEmailConfigured(),
    aiConfigured: isEmailAiConfigured(),
  });
}
