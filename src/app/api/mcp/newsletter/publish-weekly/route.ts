import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { publishWeeklyNewsletterViaMcp } from "@/lib/newsletter-publish-weekly";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * One-shot endpoint for Grok scheduled tasks and automation.
 * Generates a fresh newsletter from latest AI news, publishes it, and emails subscribers.
 */
export async function POST(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  try {
    const result = await publishWeeklyNewsletterViaMcp();
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const siteOrigin = host ? `${proto}://${host}` : "";

    return NextResponse.json({
      success: true,
      message: "Weekly newsletter generated, published, and emailed.",
      ...result,
      edition: {
        ...result.edition,
        publicUrl: siteOrigin
          ? `${siteOrigin}${result.edition.publicUrl}`
          : result.edition.publicUrl,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}