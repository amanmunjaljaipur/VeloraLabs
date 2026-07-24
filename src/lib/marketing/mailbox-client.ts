import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import { sendTransactionalEmail, type SendEmailInput } from "@/lib/send-email";

/**
 * Email Suite's read path: connects to a real IMAP mailbox (Gmail, Zoho,
 * Outlook, any standard IMAP host work) to list and fetch messages so the
 * Marketing Board can show a real inbox next to the social channels rather
 * than just being able to send. Sending is delegated straight to the
 * existing SMTP/Resend transactional sender - no need to reinvent that.
 *
 * Credentials are a single mailbox, configured via env vars (IMAP_HOST,
 * IMAP_PORT, IMAP_USER, IMAP_PASS). Nothing here persists the password -
 * every call opens a fresh connection and logs out when done.
 */

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

export function isMailboxConfigured(): boolean {
  return Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);
}

function getClient(): ImapFlow {
  const host = process.env.IMAP_HOST!;
  const port = Number(process.env.IMAP_PORT ?? "993");
  const secure = process.env.IMAP_SECURE !== "false";

  return new ImapFlow({
    host,
    port,
    secure,
    auth: {
      user: process.env.IMAP_USER!,
      pass: process.env.IMAP_PASS!,
    },
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

/** Most recent messages in the mailbox, newest first. */
export async function listRecentMessages(limit = 50): Promise<MailboxMessage[]> {
  if (!isMailboxConfigured()) return [];

  const client = getClient();
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

export async function fetchMessageByUid(uid: number): Promise<MailboxMessage | null> {
  if (!isMailboxConfigured()) return null;

  const client = getClient();
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

export async function markMessageSeen(uid: number): Promise<void> {
  if (!isMailboxConfigured()) return;
  const client = getClient();
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

/** Reuses the site's existing SMTP/Resend transactional sender for outbound mail. */
export async function sendMailboxMessage(input: SendEmailInput): Promise<boolean> {
  return sendTransactionalEmail(input);
}
