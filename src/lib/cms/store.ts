import { readJsonFile, readTextFile, writeJsonFile, writeTextFile } from "@/lib/data-store";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CMS_UPLOADS_DIR = "cms-uploads";

export function readCmsJson<T>(filename: string): T {
  const seed = readSeedContent(filename);
  return readJsonFile<T>(filename, seed);
}

export function writeCmsJson(filename: string, data: unknown): void {
  writeJsonFile(filename, data);
}

export function readCmsText(filename: string): string {
  const seedPath = path.join(CONTENT_DIR, filename);
  const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf8") : "";
  return readTextFile(filename, seed);
}

export function writeCmsText(filename: string, content: string): void {
  const seedPath = path.join(CONTENT_DIR, filename);
  const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf8") : "";
  writeTextFile(filename, content, seed);
}

function readSeedContent(filename: string): string {
  const seedPath = path.join(CONTENT_DIR, filename);
  if (fs.existsSync(seedPath)) {
    return fs.readFileSync(seedPath, "utf8");
  }
  return "{}";
}

function uploadsRoot(): string {
  const root = path.join(
    process.env.VERCEL === "1" || process.env.VERCEL_ENV
      ? path.join("/tmp", "verlin-labs-data")
      : path.join(process.cwd(), "public"),
    CMS_UPLOADS_DIR
  );
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

export function listCmsUploads(): string[] {
  const root = uploadsRoot();
  return fs
    .readdirSync(root)
    .filter((f) => !f.startsWith("."))
    .sort();
}

export function saveCmsUpload(filename: string, buffer: Buffer): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const root = uploadsRoot();
  fs.writeFileSync(path.join(root, safe), buffer);
  return `/api/cms/media/${encodeURIComponent(safe)}`;
}

export function readCmsUpload(filename: string): Buffer | null {
  const safe = path.basename(filename);
  const filePath = path.join(uploadsRoot(), safe);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function listPublicImages(): string[] {
  const imagesDir = path.join(process.cwd(), "public", "images");
  if (!fs.existsSync(imagesDir)) return [];

  const files: string[] = [];
  function walk(dir: string, prefix: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name)) {
        files.push(`/images/${rel.replace(/\\/g, "/")}`);
      }
    }
  }
  walk(imagesDir, "");
  return files.sort();
}