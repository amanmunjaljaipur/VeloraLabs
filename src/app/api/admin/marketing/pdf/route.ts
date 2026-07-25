import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { buildSlideDeckPdf, type SlideInput } from "@/lib/marketing/slide-deck";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * On-demand PDF generation for the Marketing Board composer's "Download PDF"
 * button. Previously buildSlideDeckPdf only ever ran inside publisher.ts at
 * actual publish time - this lets an admin preview/download the exact deck
 * before ever posting it (or without posting it at all).
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const rawSlides = Array.isArray(body?.slides) ? (body.slides as unknown[]) : [];

  const slides: SlideInput[] = rawSlides
    .map((raw): SlideInput | null => {
      if (!raw || typeof raw !== "object") return null;
      const record = raw as Record<string, unknown>;
      const heading = typeof record.heading === "string" ? record.heading.trim() : "";
      const bodyText = typeof record.body === "string" ? record.body.trim() : "";
      return heading ? { heading, body: bodyText || undefined } : null;
    })
    .filter((s): s is SlideInput => s !== null);

  if (slides.length < 2) {
    return NextResponse.json({ error: "Add at least 2 slides to generate a PDF" }, { status: 400 });
  }
  if (slides.length > 20) {
    return NextResponse.json({ error: "Keep it to 20 slides or fewer" }, { status: 400 });
  }

  const brandLabel =
    typeof body?.brandLabel === "string" && body.brandLabel.trim() ? body.brandLabel.trim() : "Verlin Labs";

  try {
    const pdfBytes = await buildSlideDeckPdf({ slides, brandLabel });
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="verlin-labs-slides.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not build the PDF" }, { status: 500 });
  }
}
