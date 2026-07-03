import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import {
  ensureNewsletterSubscriber,
  getNewsletterSubscriberEmails,
} from "@/lib/newsletter-subscribers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const emails = await getNewsletterSubscriberEmails();
  return NextResponse.json({
    success: true,
    count: emails.length,
    subscribers: emails,
  });
}

const addSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(120).optional(),
});

export async function POST(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const record = await ensureNewsletterSubscriber(
    parsed.data.email,
    parsed.data.source ?? "MCP"
  );

  return NextResponse.json({
    success: true,
    subscriber: record,
  });
}