import { getLatestNewsletterEdition, getNewsletterEditionBySlug } from "@/lib/news-updates";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("edition") ?? undefined;
  const edition = slug
    ? await getNewsletterEditionBySlug(slug)
    : await getLatestNewsletterEdition();

  if (!edition) {
    return NextResponse.json({ error: "No published newsletter yet" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    edition: {
      editionId: edition.editionId,
      weekOf: edition.weekOf,
      slug: edition.slug,
      title: edition.title,
      intro: edition.intro,
      itemCount: edition.itemCount,
      publishedAt: edition.publishedAt,
      markdown: edition.markdown,
      html: edition.html,
      publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
    },
  });
}