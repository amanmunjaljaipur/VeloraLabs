import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function getRuntimeDir(): string {
  return isVercelRuntime()
    ? path.join("/tmp", "verlin-labs-data")
    : CONTENT_DIR;
}

function ensureRuntimeFile(filename: string, defaultContent: string): string {
  const runtimeDir = getRuntimeDir();
  const runtimePath = path.join(runtimeDir, filename);

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  if (!fs.existsSync(runtimePath)) {
    const seedPath = path.join(CONTENT_DIR, filename);
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, runtimePath);
    } else {
      fs.writeFileSync(runtimePath, `${defaultContent}\n`, "utf8");
    }
  }

  return runtimePath;
}

export function readJsonFile<T>(filename: string, defaultContent = "{}"): T {
  const filePath = ensureRuntimeFile(filename, defaultContent);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filename: string, data: unknown, defaultContent = "{}"): void {
  const filePath = ensureRuntimeFile(filename, defaultContent);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // chmod is best-effort (e.g. Windows, /tmp on Vercel)
  }
}