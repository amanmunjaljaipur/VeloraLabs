import { listPublishedNewsletterEditions } from "@/lib/news-updates";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const editions = await listPublishedNewsletterEditions();

  return NextResponse.json({
    success: true,
    count: editions.length,
    editions: editions.map((edition) => ({
      editionId: edition.editionId,
      weekOf: edition.weekOf,
      slug: edition.slug,
      title: edition.title,
      intro: edition.intro,
      itemCount: edition.itemCount,
      publishedAt: edition.publishedAt,
      publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
    })),
  });
}