import {
  CONTACT_EMAIL,
  getDefaultFromAddress,
  resolveFromAddress as pickFromAddress,
} from "@/lib/brand-email";
import { getResendFromAddress, getResendReplyTo } from "@/lib/resend-from";
import nodemailer from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export function isTransactionalEmailConfigured(): boolean {
  return isSmtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

export function getEmailProvider(): "smtp" | "resend" | "none" {
  if (isSmtpConfigured()) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  return "none";
}

async function resolveOutgoingFromAddress(preferred?: string | null): Promise<string> {
  if (isSmtpConfigured()) {
    return pickFromAddress(
      preferred ?? process.env.SMTP_FROM ?? process.env.AUTH_FROM_EMAIL,
      getDefaultFromAddress()
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return getDefaultFromAddress();
  }

  return getResendFromAddress({
    authPreferred: preferred ?? process.env.AUTH_FROM_EMAIL,
    newsletterPreferred: preferred ?? process.env.NEWSLETTER_FROM_EMAIL,
    apiKey,
  });
}

async function sendViaSmtp(input: SendEmailInput): Promise<boolean> {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const from = input.from ?? (await resolveOutgoingFromAddress());
  const replyTo = input.replyTo ?? getResendReplyTo();

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
  });

  return true;
}

async function sendViaResend(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from ?? (await resolveOutgoingFromAddress()),
      reply_to: input.replyTo ?? getResendReplyTo(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend email failed for ${input.to}:`, body);
    return false;
  }

  return true;
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<boolean> {
  try {
    if (isSmtpConfigured()) {
      await sendViaSmtp(input);
      return true;
    }

    if (process.env.RESEND_API_KEY) {
      return sendViaResend(input);
    }

    console.error("Email skipped: configure SMTP or RESEND_API_KEY");
    return false;
  } catch (error) {
    console.error(`Email failed for ${input.to}:`, error);

    if (isSmtpConfigured() && process.env.RESEND_API_KEY) {
      try {
        return await sendViaResend(input);
      } catch (fallbackError) {
        console.error(`Resend fallback failed for ${input.to}:`, fallbackError);
      }
    }

    return false;
  }
}

export function getConfiguredFromPreview(): string {
  if (isSmtpConfigured()) {
    return (
      process.env.SMTP_FROM ??
      process.env.AUTH_FROM_EMAIL ??
      getDefaultFromAddress()
    );
  }

  return (
    process.env.NEWSLETTER_FROM_EMAIL ??
    process.env.AUTH_FROM_EMAIL ??
    getDefaultFromAddress()
  );
}

export function getConfiguredReplyTo(): string {
  return process.env.SMTP_REPLY_TO ?? CONTACT_EMAIL;
}