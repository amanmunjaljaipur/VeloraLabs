import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

/**
 * Compiles a Marketing Board carousel into a square-slide PDF for
 * LinkedIn's document-post format - 1080x1080-equivalent pages, one idea
 * per slide, matching 2026 LinkedIn carousel best practice (hook slide,
 * 4-8 content slides, CTA slide). Reuses the pdf-lib approach already
 * proven in newsletter-pdf.ts, simplified to a single square layout.
 */

const SIZE = 1080;
const MARGIN = 90;
const CONTENT_WIDTH = SIZE - MARGIN * 2;

const BRAND = rgb(13 / 255, 148 / 255, 136 / 255);
const TEXT = rgb(15 / 255, 23 / 255, 42 / 255);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const WHITE = rgb(1, 1, 1);

export interface SlideInput {
  /** Short heading for the slide (the one idea it delivers) */
  heading: string;
  /** Supporting body text, optional */
  body?: string;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Builds a slide-deck PDF. First slide is the hook (brand-colored), last is a CTA if provided. */
export async function buildSlideDeckPdf(input: {
  slides: SlideInput[];
  brandLabel?: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  input.slides.forEach((slide, index) => {
    const page = doc.addPage([SIZE, SIZE]);
    const isHook = index === 0;

    if (isHook) {
      page.drawRectangle({ x: 0, y: 0, width: SIZE, height: SIZE, color: BRAND });
    } else {
      page.drawRectangle({ x: 0, y: 0, width: SIZE, height: SIZE, color: WHITE });
    }

    const headingColor = isHook ? WHITE : TEXT;
    const bodyColor = isHook ? WHITE : MUTED;
    const headingSize = isHook ? 56 : 40;
    const headingLines = wrapText(slide.heading, bold, headingSize, CONTENT_WIDTH);

    let y = SIZE / 2 + (headingLines.length * (headingSize + 8)) / 2;
    for (const line of headingLines) {
      page.drawText(line, { x: MARGIN, y, size: headingSize, font: bold, color: headingColor });
      y -= headingSize + 8;
    }

    if (slide.body) {
      y -= 20;
      const bodyLines = wrapText(slide.body, regular, 22, CONTENT_WIDTH);
      for (const line of bodyLines.slice(0, 8)) {
        page.drawText(line, { x: MARGIN, y, size: 22, font: regular, color: bodyColor });
        y -= 32;
      }
    }

    // Slide number + brand mark, bottom corners.
    page.drawText(`${index + 1}/${input.slides.length}`, {
      x: SIZE - MARGIN - 40,
      y: 50,
      size: 16,
      font: regular,
      color: isHook ? WHITE : MUTED,
    });
    if (input.brandLabel) {
      page.drawText(input.brandLabel, {
        x: MARGIN,
        y: 50,
        size: 16,
        font: bold,
        color: isHook ? WHITE : BRAND,
      });
    }
  });

  return doc.save();
}
