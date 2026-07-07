import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { createCustomCmsPage } from "@/lib/cms/dynamic-pages";
import { getAllCmsPages } from "@/lib/cms/registry";
import { writeRichPageContent } from "@/lib/cms/rich-content";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    pages: getAllCmsPages(),
    updatedBy: session.user.email,
  });
}

export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { label?: string; description?: string; publicPath?: string; group?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const page = createCustomCmsPage({
      label: body.label ?? "",
      description: body.description,
      publicPath: body.publicPath ?? "",
      group: body.group,
    });

    writeRichPageContent(page.filename, {
      title: page.label,
      subtitle: page.description,
      bodyHtml: "<p>Start writing your page content here.</p>",
      seoDescription: page.description,
      heroImage: "",
      heroImageAlt: "",
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}