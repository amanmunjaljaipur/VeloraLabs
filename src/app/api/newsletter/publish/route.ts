import { apiKeyUnauthorized, verifyApiKey } from "@/lib/api-key-auth";
import { publishWeeklyNewsletter } from "@/lib/news-updates";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const publishSchema = z.object({
  weekOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  intro: z.string().min(10).max(500).optional(),
});

function canPublish(request: NextRequest): boolean {
  return (
    verifyApiKey(request, "NEWS_PUBLISH_API_KEY") || verifyApiKey(request, "CRON_SECRET")
  );
}

export async function POST(request: NextRequest) {
  if (!canPublish(request)) {
    return apiKeyUnauthorized();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = publishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const edition = await publishWeeklyNewsletter(parsed.data);

    return NextResponse.json({
      success: true,
      edition: {
        editionId: edition.editionId,
        weekOf: edition.weekOf,
        slug: edition.slug,
        title: edition.title,
        itemCount: edition.itemCount,
        publishedAt: edition.publishedAt,
        publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    const status = message.includes("No pending") || message.includes("already published") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}