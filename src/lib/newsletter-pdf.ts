import PDFDocument from "pdfkit";
import type { NewsletterDraftContent } from "@/lib/newsletter-rich-compile";

type PdfDoc = InstanceType<typeof PDFDocument>;

const BRAND = "#0d9488";
const MUTED = "#64748b";

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function writeWrappedText(
  doc: PdfDoc,
  text: string,
  options?: { font?: string; size?: number; color?: string; indent?: number }
): void {
  const font = options?.font ?? "Helvetica";
  const size = options?.size ?? 11;
  const color = options?.color ?? "#1e293b";
  const indent = options?.indent ?? 0;

  doc.font(font).fontSize(size).fillColor(color);
  doc.text(text, doc.page.margins.left + indent, doc.y, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - indent,
    align: "left",
  });
}

function ensureSpace(doc: PdfDoc, minHeight: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + minHeight > bottom) {
    doc.addPage();
  }
}

export function newsletterPdfFilename(draft: NewsletterDraftContent): string {
  return `verlin-labs-newsletter-${sanitizeFilename(draft.title)}.pdf`;
}

export async function generateNewsletterPdf(draft: NewsletterDraftContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: draft.title,
        Author: "Verlin Labs",
        Subject: "AI Weekly Newsletter",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 120).fill(BRAND);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
    doc.text("VERLIN LABS NEWSLETTER", 56, 42);
    doc.fontSize(22).text(draft.title, 56, 62, {
      width: doc.page.width - 112,
    });

    doc.moveDown(3);
    doc.fillColor(MUTED).font("Helvetica").fontSize(10);
    doc.text(
      `Published ${new Date(draft.updatedAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
      56,
      140
    );

    doc.y = 170;
    writeWrappedText(doc, draft.intro, { size: 12, color: "#334155" });
    doc.moveDown(1.2);

    draft.stories.forEach((story, index) => {
      ensureSpace(doc, 180);

      doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(10);
      doc.text(`${story.source.toUpperCase()} · ${story.category.toUpperCase()}`);
      doc.moveDown(0.4);

      writeWrappedText(doc, `${index + 1}. ${story.title}`, {
        font: "Helvetica-Bold",
        size: 14,
      });
      doc.moveDown(0.5);

      writeWrappedText(doc, story.summary, { size: 11, color: "#475569" });
      doc.moveDown(0.6);

      doc.rect(doc.x, doc.y, doc.page.width - 112, 1).fill("#e2e8f0");
      doc.moveDown(0.6);

      writeWrappedText(doc, "Clarity lens", {
        font: "Helvetica-Bold",
        size: 10,
        color: BRAND,
      });
      doc.moveDown(0.2);
      writeWrappedText(doc, story.mentalModelTip, { size: 10, color: "#334155" });
      doc.moveDown(0.6);

      if (story.url) {
        writeWrappedText(doc, `Read more: ${story.url}`, {
          size: 9,
          color: BRAND,
        });
      }

      doc.moveDown(1.4);
      doc.strokeColor("#e2e8f0").moveTo(56, doc.y).lineTo(doc.page.width - 56, doc.y).stroke();
      doc.moveDown(1);
    });

    ensureSpace(doc, 80);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9);
    doc.text(
      "Curated for Verlin Labs learners. Mental models for clarity-first AI learning.",
      56,
      doc.y,
      { width: doc.page.width - 112, align: "center" }
    );

    doc.end();
  });
}