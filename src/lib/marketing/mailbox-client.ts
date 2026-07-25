import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { sendTransactionalEmail, type SendEmailInput } from "@/lib/send-email";

/**
 * Email Suite's read path: connects to a real IMAP mailbox (Gmail, Zoho,
 * Outlook, any standard IMAP host works) to list and fetch messages so the
 * Marketing Board can show a real inbox next to the social channels rather
 * than just being able to send.
 *
 * Parameterized by MailboxCredentials rather than reading env vars directly
 * - inbox-store.ts calls this once per connected mailbox (see
 * mailboxes-store.ts) and merges the results into one unified inbox, the
 * same way Gmail lets you add several accounts and see them in one place.
 * Nothing here persists a connection - every call opens a fresh IMAP
 * session and logs out when done.
 *
 * LEGACY_MAILBOX_ID: before per-mailbox credential storage existed, the
 * whole suite ran off one mailbox configured via IMAP_HOST/IMAP_USER/
 * IMAP_PASS env vars. That mailbox still works today - getLegacyMailbox()
 * surfaces it as just another account (non-removable, since it's server
 * config, not something stored per-tenant) so nothing that was already
 * cached breaks when multi-mailbox support lands on top of it.
 */

export const LEGACY_MAILBOX_ID = "legacy-env";

export interface MailboxCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface MailboxMessage {
  uid: number;
  messageId: string | null;
  from: string;
  fromName: string | null;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string | null;
  date: string;
  seen: boolean;
  flagged: boolean;
}

export function isLegacyMailboxConfigured(): boolean {
  return Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);
}

/** Back-compat alias - existing call sites (config route) ask "is the mailbox configured" without caring which one. */
export const isMailboxConfigured = isLegacyMailboxConfigured;

export function getLegacyCredentials(): MailboxCredentials | null {
  if (!isLegacyMailboxConfigured()) return null;
  return {
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT ?? "993"),
    secure: process.env.IMAP_SECURE !== "false",
    user: process.env.IMAP_USER!,
    pass: process.env.IMAP_PASS!,
  };
}

function getClient(creds: MailboxCredentials): ImapFlow {
  return new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: { user: creds.user, pass: creds.pass },
    logger: false,
  });
}

async function parseMessage(uid: number, raw: FetchMessageObject): Promise<MailboxMessage> {
  const source = raw.source;
  const parsed = source ? await simpleParser(source) : null;

  const bodyText = parsed?.text?.trim() ?? "";
  const bodyHtml = typeof parsed?.html === "string" ? parsed.html : null;
  const fromAddr = parsed?.from?.value?.[0];

  return {
    uid,
    messageId: parsed?.messageId ?? null,
    from: fromAddr?.address ?? "unknown@unknown",
    fromName: fromAddr?.name ?? null,
    subject: parsed?.subject ?? "(no subject)",
    snippet: bodyText.slice(0, 220),
    bodyText,
    bodyHtml,
    date: (parsed?.date ?? new Date()).toISOString(),
    seen: raw.flags?.has("\\Seen") ?? false,
    flagged: raw.flags?.has("\\Flagged") ?? false,
  };
}

/** Opens a connection just to prove the credentials work - used by the "Test & connect" button before saving anything. */
export async function testMailboxConnection(creds: MailboxCredentials): Promise<{ ok: boolean; error: string | null }> {
  const client = getClient(creds);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    lock.release();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not connect" };
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/** Most recent messages in the mailbox, newest first. */
export async function listRecentMessages(creds: MailboxCredentials, limit = 50): Promise<MailboxMessage[]> {
  const client = getClient(creds);
  await client.connect();
  const messages: MailboxMessage[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return [];

      const start = Math.max(1, total - limit + 1);
      for await (const message of client.fetch(
        `${start}:*`,
        { envelope: true, flags: true, source: true, uid: true }
      )) {
        const parsed = await parseMessage(message.uid, message);
        messages.push(parsed);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }

  return messages.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchMessageByUid(creds: MailboxCredentials, uid: number): Promise<MailboxMessage | null> {
  const client = getClient(creds);
  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const message of client.fetch(
        { uid: String(uid) },
        { envelope: true, flags: true, source: true, uid: true },
        { uid: true }
      )) {
        return parseMessage(message.uid, message);
      }
      return null;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

export async function markMessageSeen(creds: MailboxCredentials, uid: number): Promise<void> {
  const client = getClient(creds);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsAdd({ uid: String(uid) }, ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/**
 * Sends from a specific connected mailbox's own SMTP credentials when it has
 * them, otherwise falls back to the site's existing SMTP/Resend transactional
 * sender (the original single-mailbox behavior). This is what lets "reply
 * from support@" actually come from support@ instead of always from the
 * site's default sender.
 */
export async function sendMailboxMessage(input: SendEmailInput, smtp?: SmtpCredentials | null): Promise<boolean> {
  if (!smtp) return sendTransactionalEmail(input);

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.sendMail({
      from: input.from ?? smtp.user,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });
    return true;
  } catch (error) {
    console.error(`Mailbox send failed for ${input.to}:`, error);
    return false;
  }
}
