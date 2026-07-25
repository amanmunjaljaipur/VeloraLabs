import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Composites the Verlin Labs brand icon onto AI-generated marketing images
 * so anything that gets shared, reposted, or screenshotted away from its
 * original context still carries the brand. Bottom-right corner, sized
 * proportionally to the image, alpha dialed back so it reads as a
 * watermark rather than a sticker slapped on top of the artwork.
 *
 * Applied once, centrally, in ai-image.ts's generateMarketingImage() - so
 * every caller (composer, Growth Advisor auto-execute, email banner
 * generation) gets consistent branding for free rather than each needing
 * its own watermark logic.
 */

const WATERMARK_RELATIVE_PATH = ["public", "images", "verlin-brand-icon.png"];
/** Fraction of the image's shorter side the mark's width/height should span. */
const MARK_SIZE_RATIO = 0.09;
/** Fraction of the image's shorter side used as edge padding. */
const PADDING_RATIO = 0.035;
/** 0-1 alpha multiplier - keeps the mark legible without competing with the artwork. */
const WATERMARK_OPACITY = 0.82;

let watermarkSourceCache: Buffer | null = null;

function loadWatermarkSource(): Buffer {
  if (!watermarkSourceCache) {
    watermarkSourceCache = fs.readFileSync(path.join(process.cwd(), ...WATERMARK_RELATIVE_PATH));
  }
  return watermarkSourceCache;
}

/**
 * Returns a new image buffer with the brand icon composited in. Never
 * throws - on any failure (corrupt image, missing asset, unsupported
 * format) it logs and returns the original bytes unchanged, since a
 * missing watermark is cosmetic and must never block publishing.
 */
export async function applyBrandWatermark(
  imageBytes: Buffer | ArrayBuffer,
  contentType: string
): Promise<Buffer> {
  try {
    const input = Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes);
    const base = sharp(input);
    const meta = await base.metadata();
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1080;
    const shortSide = Math.min(width, height);

    const markSize = Math.max(28, Math.round(shortSide * MARK_SIZE_RATIO));
    const padding = Math.max(10, Math.round(shortSide * PADDING_RATIO));

    const watermark = await sharp(loadWatermarkSource())
      .resize(markSize, markSize, { fit: "contain" })
      // Scale only the alpha band (4th of RGBA) down - keeps colors true
      // while making the mark translucent.
      .linear([1, 1, 1, WATERMARK_OPACITY], [0, 0, 0, 0])
      .png()
      .toBuffer();

    const composited = base.composite([
      {
        input: watermark,
        left: Math.max(0, width - markSize - padding),
        top: Math.max(0, height - markSize - padding),
      },
    ]);

    return contentType.includes("png")
      ? await composited.png().toBuffer()
      : await composited.jpeg({ quality: 90 }).toBuffer();
  } catch (error) {
    console.error("[marketing] brand watermark failed, using unwatermarked image:", error);
    return Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes);
  }
}
