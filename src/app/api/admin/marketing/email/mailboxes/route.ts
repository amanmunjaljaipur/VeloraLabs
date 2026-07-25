import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import {
  LEGACY_MAILBOX_ID,
  getLegacyCredentials,
  testMailboxConnection,
  type MailboxCredentials,
} from "@/lib/marketing/mailbox-client";
import {
  listPublicMailboxes,
  removeMailbox,
  toPublicMailbox,
  upsertMailbox,
  type PublicMailbox,
} from "@/lib/marketing/mailboxes-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Multi-mailbox login for the Email Suite - the "manage several email
 * accounts in one place" feature, UX modeled on Gmail's account switcher.
 * Reading/sending with an already-connected mailbox is available to any
 * admin (same as the rest of Email Suite); *adding* one means handing over
 * IMAP/SMTP credentials, which is the same trust tier as connecting a
 * social account, so that step is super-admin only.
 */

function isSuperAdmin(session: Awaited<ReturnType<typeof requireCmsEditor>>): boolean {
  const email = session?.user?.email;
  return Boolean(email) && (isHardcodedSuperAdmin(email) || isSuperAdminRole(session?.user?.role));
}

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const mailboxes = await listPublicMailboxes(tenantId);

  // Surface the env-configured mailbox (if any) as just another account in
  // the switcher, same as resolveActiveMailboxes does for syncing - it just
  // isn't removable here since it's server config, not a stored row.
  const legacy = getLegacyCredentials();
  if (legacy && !mailboxes.some((m) => m.email.toLowerCase() === legacy.user.toLowerCase())) {
    const legacyMailbox: PublicMailbox = {
      id: LEGACY_MAILBOX_ID,
      email: legacy.user,
      displayName: "Primary inbox",
      color: "#0F6E56",
      usesCustomSmtp: false,
      status: "connected",
      lastError: null,
      lastSyncedAt: null,
    };
    mailboxes.unshift(legacyMailbox);
  }

  return NextResponse.json({ mailboxes });
}

export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Only a super admin can connect a mailbox" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const imapHost = String(body?.imapHost ?? "").trim();
  const imapUser = String(body?.imapUser ?? "").trim();
  const imapPass = String(body?.imapPass ?? "");
  const imapPort = Number(body?.imapPort ?? 993);
  const imapSecure = body?.imapSecure !== false;

  if (!email.includes("@") || !imapHost || !imapUser || !imapPass) {
    return NextResponse.json(
      { error: "Email, IMAP host, username, and password are required" },
      { status: 400 }
    );
  }

  const creds: MailboxCredentials = { host: imapHost, port: imapPort, secure: imapSecure, user: imapUser, pass: imapPass };

  const test = await testMailboxConnection(creds);
  if (!test.ok) {
    return NextResponse.json({ error: test.error ?? "Could not connect with these credentials" }, { status: 400 });
  }

  const useCustomSmtp = Boolean(body?.useCustomSmtp);
  const tenantId = await resolveTenantId(session.user?.email);

  const record = await upsertMailbox({
    tenantId,
    email,
    displayName: typeof body?.displayName === "string" ? body.displayName : undefined,
    imapHost,
    imapPort,
    imapSecure,
    imapUser,
    imapPass,
    smtpHost: useCustomSmtp ? String(body?.smtpHost ?? "").trim() || null : null,
    smtpPort: useCustomSmtp ? Number(body?.smtpPort ?? 465) : null,
    smtpSecure: useCustomSmtp ? body?.smtpSecure !== false : true,
    smtpUser: useCustomSmtp ? String(body?.smtpUser ?? "").trim() || imapUser : null,
    smtpPass: useCustomSmtp ? String(body?.smtpPass ?? "") || imapPass : null,
    connectedBy: session.user?.email ?? "unknown",
  });

  return NextResponse.json({ mailbox: toPublicMailbox(record) });
}

export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Only a super admin can remove a mailbox" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tenantId = await resolveTenantId(session.user?.email);
  const removed = await removeMailbox(id, tenantId);
  if (!removed) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
