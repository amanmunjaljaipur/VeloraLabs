import { getMentalModel, getMentalModels } from "@/lib/content";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Public, read-only, unauthenticated API - a lightweight way for developers
 * and integration partners to pull Verlin Labs' mental-model content into
 * their own tools (docs at /docs/api). No auth required; GET only.
 *
 * GET /api/public/mental-models          -> list (summary fields only)
 * GET /api/public/mental-models?slug=X   -> single model, full detail
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const model = getMentalModel(slug);
    if (!model) {
      return NextResponse.json({ success: false, error: "Mental model not found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        success: true,
        model: {
          slug: model.slug,
          name: model.name,
          shortDescription: model.shortDescription,
          description: model.description,
          difficulty: model.difficulty,
          readTime: model.readTime,
          whyItMatters: model.whyItMatters,
          keyPrinciples: model.keyPrinciples,
          howToApply: model.howToApply,
          examples: model.examples,
          commonMistakes: model.commonMistakes,
          keyTakeaway: model.keyTakeaway,
          publicUrl: `https://www.verlinlabs.com/mental-models/${model.slug}`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
    );
  }

  const models = getMentalModels();
  return NextResponse.json(
    {
      success: true,
      count: models.length,
      models: models.map((m) => ({
        slug: m.slug,
        name: m.name,
        shortDescription: m.shortDescription,
        difficulty: m.difficulty,
        readTime: m.readTime,
        publicUrl: `https://www.verlinlabs.com/mental-models/${m.slug}`,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
  );
}
