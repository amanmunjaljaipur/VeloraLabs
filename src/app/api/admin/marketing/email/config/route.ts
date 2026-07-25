import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isMailboxConfigured } from "@/lib/marketing/mailbox-client";
import { listPublicMailboxes } from "@/lib/marketing/mailboxes-store";
import { isTransactionalEmailConfigured } from "@/lib/send-email";
import { isEmailAiConfigured } from "@/lib/marketing/ai-email-assist";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Whether the Email Suite channel can read (IMAP) and/or send (SMTP/Resend). */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const mailboxes = await listPublicMailboxes(tenantId);

  return NextResponse.json({
    inboxConfigured: isMailboxConfigured() || mailboxes.length > 0,
    sendConfigured: isTransactionalEmailConfigured(),
    aiConfigured: isEmailAiConfigured(),
  });
}
