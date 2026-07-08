import type { NewsletterDraftContent } from "@/lib/newsletter-rich-compile";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BRAND = rgb(13 / 255, 148 / 255, 136 / 255);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const TEXT = rgb(30 / 255, 41 / 255, 59 / 255);
const TEXT_SOFT = rgb(51 / 255, 65 / 255, 85 / 255);
const DIVIDER = rgb(226 / 255, 232 / 255, 240 / 255);
const WHITE = rgb(1, 1, 1);

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

interface LayoutContext {
  doc: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  y: number;
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
        let chunk = "";
        for (const char of word) {
          const next = chunk + char;
          if (font.widthOfTextAtSize(next, size) > maxWidth && chunk) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk = next;
          }
        }
        current = chunk;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
  }

  return lines.length ? lines : [""];
}

function addPage(ctx: LayoutContext): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = MARGIN;
}

function ensureSpace(ctx: LayoutContext, height: number): void {
  if (ctx.y + height > PAGE_HEIGHT - MARGIN) {
    addPage(ctx);
  }
}

function drawLines(
  ctx: LayoutContext,
  lines: string[],
  options: {
    font: PDFFont;
    size: number;
    color: RGB;
    lineHeight?: number;
    indent?: number;
  }
): void {
  const lineHeight = options.lineHeight ?? options.size * 1.45;
  const x = MARGIN + (options.indent ?? 0);

  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.page.drawText(line, {
      x,
      y: PAGE_HEIGHT - ctx.y - options.size,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    ctx.y += lineHeight;
  }
}

function drawParagraph(
  ctx: LayoutContext,
  text: string,
  options: {
    font: PDFFont;
    size: number;
    color: RGB;
    lineHeight?: number;
    indent?: number;
    gapAfter?: number;
  }
): void {
  const maxWidth = CONTENT_WIDTH - (options.indent ?? 0);
  const lines = wrapText(text, options.font, options.size, maxWidth);
  drawLines(ctx, lines, options);
  ctx.y += options.gapAfter ?? 0;
}

function drawDivider(ctx: LayoutContext): void {
  ensureSpace(ctx, 12);
  ctx.page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - ctx.y },
    thickness: 1,
    color: DIVIDER,
  });
  ctx.y += 12;
}

export function newsletterPdfFilename(draft: NewsletterDraftContent): string {
  return `verlin-labs-newsletter-${sanitizeFilename(draft.title)}.pdf`;
}

export async function generateNewsletterPdf(draft: NewsletterDraftContent): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(draft.title);
  doc.setAuthor("Verlin Labs");
  doc.setSubject("AI Weekly Newsletter");

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const firstPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const ctx: LayoutContext = { doc, page: firstPage, fonts, y: MARGIN };

  firstPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 120,
    width: PAGE_WIDTH,
    height: 120,
    color: BRAND,
  });

  firstPage.drawText("VERLIN LABS NEWSLETTER", {
    x: MARGIN,
    y: PAGE_HEIGHT - 78,
    size: 11,
    font: fonts.bold,
    color: WHITE,
  });

  const titleLines = wrapText(draft.title, fonts.bold, 22, CONTENT_WIDTH);
  let titleY = PAGE_HEIGHT - 100;
  for (const line of titleLines.slice(0, 3)) {
    firstPage.drawText(line, {
      x: MARGIN,
      y: titleY,
      size: 22,
      font: fonts.bold,
      color: WHITE,
    });
    titleY -= 26;
  }

  ctx.y = 140;

  drawParagraph(
    ctx,
    `Published ${new Date(draft.updatedAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
    {
      font: fonts.regular,
      size: 10,
      color: MUTED,
      gapAfter: 16,
    }
  );

  drawParagraph(ctx, draft.intro, {
    font: fonts.regular,
    size: 12,
    color: TEXT_SOFT,
    gapAfter: 20,
  });

  draft.stories.forEach((story, index) => {
    ensureSpace(ctx, 180);

    drawParagraph(ctx, `${story.source.toUpperCase()} · ${story.category.toUpperCase()}`, {
      font: fonts.bold,
      size: 10,
      color: BRAND,
      gapAfter: 8,
    });

    drawParagraph(ctx, `${index + 1}. ${story.title}`, {
      font: fonts.bold,
      size: 14,
      color: TEXT,
      gapAfter: 10,
    });

    drawParagraph(ctx, story.summary, {
      font: fonts.regular,
      size: 11,
      color: TEXT_SOFT,
      gapAfter: 12,
    });

    drawDivider(ctx);

    drawParagraph(ctx, "Clarity lens", {
      font: fonts.bold,
      size: 10,
      color: BRAND,
      gapAfter: 6,
    });

    drawParagraph(ctx, story.mentalModelTip, {
      font: fonts.regular,
      size: 10,
      color: TEXT,
      gapAfter: 10,
    });

    if (story.url) {
      drawParagraph(ctx, `Read more: ${story.url}`, {
        font: fonts.regular,
        size: 9,
        color: BRAND,
        gapAfter: 16,
      });
    }

    drawDivider(ctx);
    ctx.y += 8;
  });

  ensureSpace(ctx, 60);
  drawParagraph(
    ctx,
    "Curated for Verlin Labs learners. Mental models for clarity-first AI learning.",
    {
      font: fonts.regular,
      size: 9,
      color: MUTED,
    }
  );

  const bytes = await doc.save();
  return Buffer.from(bytes);
}