import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  deleteCustomCmsPage,
  getCustomCmsPage,
  updateCustomCmsPageMeta,
} from "@/lib/cms/dynamic-pages";
import { getCmsPage } from "@/lib/cms/registry";
import {
  isBuilderPageContent,
  type BuilderPageContent,
} from "@/lib/cms/page-builder-types";
import {
  publishBuilderPage,
  readBuilderPageContent,
  writeBuilderPageContent,
} from "@/lib/cms/page-builder-content";
import {
  buildMarkdownFromRich,
  markdownBodyToHtml,
  parseMarkdownFrontmatter,
  readRichPageContent,
  writeRichPageContent,
  type RichPageContent,
} from "@/lib/cms/rich-content";
import { readCmsJson, readCmsText, writeCmsJson, writeCmsText } from "@/lib/cms/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageId } = await context.params;
  const page = getCmsPage(pageId);
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (page.type === "rich") {
    const custom = getCustomCmsPage(pageId);
    if (custom?.editorLayout === "builder") {
      const builder = readBuilderPageContent(page.filename);
      return NextResponse.json({
        page,
        content: builder,
        format: "builder",
      });
    }

    const stored = readRichPageContent(page.filename);
    if (isBuilderPageContent(stored)) {
      return NextResponse.json({
        page,
        content: stored,
        format: "builder",
      });
    }

    return NextResponse.json({
      page,
      content: stored,
      format: "rich",
    });
  }

  if (page.type === "markdown") {
    const raw = readCmsText(page.filename);
    const { frontmatter, body } = parseMarkdownFrontmatter(raw);
    return NextResponse.json({
      page,
      content: {
        title: frontmatter.title ?? "",
        subtitle: frontmatter.subtitle ?? "",
        bodyHtml: markdownBodyToHtml(body),
        seoDescription: frontmatter.description ?? "",
        rawMarkdown: raw,
      },
      format: "rich",
    });
  }

  return NextResponse.json({
    page,
    content: readCmsJson<unknown>(page.filename),
    format: "json",
  });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageId } = await context.params;
  const page = getCmsPage(pageId);
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    content?: unknown;
    meta?: { label?: string; description?: string; publicPath?: string; group?: string };
    publish?: boolean;
  };

  try {
    if (body.meta && getCustomCmsPage(pageId)) {
      updateCustomCmsPageMeta(pageId, body.meta);
    }

    if (page.type === "rich") {
      const incoming = body.content;
      if (isBuilderPageContent(incoming)) {
        const next = body.publish
          ? publishBuilderPage(incoming as BuilderPageContent)
          : (incoming as BuilderPageContent);
        writeBuilderPageContent(page.filename, next);
      } else {
        writeRichPageContent(page.filename, incoming as RichPageContent);
      }
      return NextResponse.json({
        ok: true,
        page: getCmsPage(pageId),
        savedAt: new Date().toISOString(),
        savedBy: session.user.email,
      });
    }

    if (page.type === "markdown") {
      const rich = body.content as RichPageContent & { rawMarkdown?: string };
      if (rich.rawMarkdown) {
        writeCmsText(page.filename, rich.rawMarkdown);
      } else {
        writeCmsText(
          page.filename,
          buildMarkdownFromRich(rich.title, rich.subtitle, rich.bodyHtml)
        );
      }
      return NextResponse.json({
        ok: true,
        page,
        savedAt: new Date().toISOString(),
        savedBy: session.user.email,
      });
    }

    if (body.content === undefined) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    writeCmsJson(page.filename, body.content);
    return NextResponse.json({
      ok: true,
      page,
      savedAt: new Date().toISOString(),
      savedBy: session.user.email,
    });
  } catch (error) {
    console.error("CMS save failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageId } = await context.params;
  if (!getCustomCmsPage(pageId)) {
    return NextResponse.json({ error: "Only custom pages can be deleted" }, { status: 400 });
  }

  deleteCustomCmsPage(pageId);
  return NextResponse.json({ ok: true });
}