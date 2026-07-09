import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "public", "images", "verlin-brand-icon.png");
const outIco = path.join(root, "src", "app", "favicon.ico");
const outPublicIco = path.join(root, "public", "favicon.ico");
const outIcon = path.join(root, "src", "app", "icon.png");
const outAppleIcon = path.join(root, "src", "app", "apple-icon.png");
const outPublicIcon = path.join(root, "public", "icon.png");
const outPublicAppleIcon = path.join(root, "public", "apple-icon.png");

const icoSizes = [16, 32, 48];

async function main() {
  const buffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(source)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png()
        .toBuffer()
    )
  );

  const ico = await pngToIco(buffers);
  fs.writeFileSync(outIco, ico);
  fs.writeFileSync(outPublicIco, ico);

  await sharp(source)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(outIcon);
  await sharp(source)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(outPublicIcon);

  await sharp(source)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(outAppleIcon);
  await sharp(source)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(outPublicAppleIcon);

  console.log(`Wrote favicon.ico (${ico.length} bytes), icon.png, apple-icon.png from ${source}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});