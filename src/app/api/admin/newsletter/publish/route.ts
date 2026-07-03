import { auth } from "@/auth";
import { publishWeeklyNewsletter } from "@/lib/news-updates";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const edition = await publishWeeklyNewsletter();

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
    const status =
      message.includes("No pending") || message.includes("already published") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}