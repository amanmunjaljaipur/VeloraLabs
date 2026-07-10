import type { StudioFileMap } from "@/lib/app-studio/types";

/**
 * Parse LLM output into a file map.
 * Handles Groq/Claude/Grok quirks: fenced JSON, truncated JSON, file arrays, XML tags.
 */
export function parseStudioFiles(raw: string): StudioFileMap {
  if (!raw?.trim()) return {};

  // 1) Prefer fenced ```json ... ``` then whole string
  const candidates = extractJsonCandidates(raw);
  for (const text of candidates) {
    const files = tryParseFilesObject(text);
    if (Object.keys(files).length) return files;
  }

  // 2) <file path="...">...</file>
  const fromXml = parseXmlFiles(raw);
  if (Object.keys(fromXml).length) return fromXml;

  // 3) ```path\ncode```
  const fromFences = parsePathFences(raw);
  if (Object.keys(fromFences).length) return fromFences;

  return {};
}

function extractJsonCandidates(raw: string): string[] {
  const out: string[] = [];
  const fenced = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const m of fenced) {
    if (m[1]?.trim()) out.push(m[1].trim());
  }
  out.push(raw.trim());
  return out;
}

function tryParseFilesObject(text: string): StudioFileMap {
  const files: StudioFileMap = {};

  // Direct parse of slice between first { and last }
  const attempts = [text];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    attempts.unshift(text.slice(start, end + 1));
  }

  // Try to repair truncated JSON by closing braces
  if (start >= 0) {
    attempts.push(repairTruncatedJson(text.slice(start)));
  }

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as Record<string, unknown>;
      const map = extractMapFromParsed(parsed);
      if (Object.keys(map).length) return map;
    } catch {
      // continue
    }
  }

  return files;
}

function extractMapFromParsed(parsed: Record<string, unknown>): StudioFileMap {
  const files: StudioFileMap = {};

  // { files: { "/path": "..." } }
  const mapLike = (parsed.files || parsed.fileMap || parsed.code) as unknown;
  if (mapLike && typeof mapLike === "object" && !Array.isArray(mapLike)) {
    for (const [path, content] of Object.entries(mapLike as Record<string, unknown>)) {
      if (typeof content === "string" && content.length > 0) {
        files[normalizePath(path)] = content;
      } else if (content && typeof content === "object" && "code" in (content as object)) {
        const code = (content as { code?: string }).code;
        if (typeof code === "string") files[normalizePath(path)] = code;
      }
    }
  }

  // { files: [ { path, content } ] }
  if (Array.isArray(mapLike)) {
    for (const item of mapLike) {
      if (!item || typeof item !== "object") continue;
      const row = item as { path?: string; name?: string; content?: string; code?: string };
      const path = row.path || row.name;
      const content = row.content ?? row.code;
      if (path && typeof content === "string") {
        files[normalizePath(path)] = content;
      }
    }
  }

  // Flat map of paths at top level: { "/src/App.tsx": "..." }
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v !== "string") continue;
    if (k.includes("/") || k.includes(".") || k.startsWith("src")) {
      files[normalizePath(k)] = v;
    }
  }

  return files;
}

/** Best-effort close of truncated JSON objects/strings from LLMs. */
function repairTruncatedJson(s: string): string {
  let t = s.trim();
  // Close open strings naively if odd number of unescaped quotes at end
  const quoteCount = (t.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 === 1) t += '"';

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  for (const ch of t) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }
  // Remove trailing comma before close
  t = t.replace(/,\s*$/, "");
  while (openBrackets > 0) {
    t += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    t += "}";
    openBraces--;
  }
  return t;
}

function parseXmlFiles(raw: string): StudioFileMap {
  const files: StudioFileMap = {};
  const fileTag = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  let m: RegExpExecArray | null;
  while ((m = fileTag.exec(raw)) !== null) {
    files[normalizePath(m[1])] = m[2].replace(/^\n/, "").replace(/\n$/, "");
  }
  return files;
}

function parsePathFences(raw: string): StudioFileMap {
  const files: StudioFileMap = {};
  const pathFence = /```([^\n`]+)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = pathFence.exec(raw)) !== null) {
    const label = m[1].trim().replace(/^file:/i, "").trim();
    if (/^(json|tsx?|jsx?|css|html|bash|text|typescript|javascript)$/i.test(label)) continue;
    if (label.includes("/") || label.includes(".")) {
      files[normalizePath(label)] = m[2];
    }
  }
  return files;
}

export function mergeFiles(base: StudioFileMap, patch: StudioFileMap): StudioFileMap {
  return { ...base, ...patch };
}

export function normalizePath(path: string): string {
  let p = path.trim().replace(/\\/g, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/^\/(?:tsx|ts|jsx|js|css|html|typescript|javascript):/i, "/");
  return p;
}

export function applyFileOps(
  current: StudioFileMap,
  ops: Array<{ path: string; content: string; action?: "write" | "delete" }>
): StudioFileMap {
  const next = { ...current };
  for (const op of ops) {
    const path = normalizePath(op.path);
    if (op.action === "delete") {
      delete next[path];
    } else {
      next[path] = op.content;
    }
  }
  return next;
}

/**
 * Map App Studio file map into Sandpack `react-ts` template paths.
 * Sandpack react-ts expects /App.tsx and /index.tsx at root (not /src/).
 */
export function toSandpackReactTsFiles(files: StudioFileMap): Record<string, string> {
  const out: Record<string, string> = {};

  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (files[k]) return files[k];
      if (files[k.replace(/^\//, "")]) return files[k.replace(/^\//, "")];
    }
    return undefined;
  };

  const app =
    get("/src/App.tsx", "/App.tsx", "/src/App.jsx", "/App.jsx") ||
    `export default function App() { return <div style={{padding:24}}>App Studio</div>; }`;

  let appCode = app;
  // Sandpack react-ts already provides React in scope via classic JSX sometimes — ensure import
  if (!/from\s+['"]react['"]/.test(appCode) && !/require\(['"]react['"]\)/.test(appCode)) {
    appCode = `import React from "react";\n${appCode}`;
  }

  out["/App.tsx"] = appCode;

  const styles = get("/src/styles.css", "/styles.css", "/src/index.css", "/App.css");
  if (styles) {
    out["/styles.css"] = styles;
    if (!out["/App.tsx"].includes("styles.css") && !out["/App.tsx"].includes("./styles")) {
      out["/App.tsx"] = `import "./styles.css";\n${out["/App.tsx"]}`;
    }
  }

  // index entry — keep template default if we don't override heavily
  const main = get("/src/main.tsx", "/src/index.tsx", "/index.tsx");
  if (main && !main.includes("createRoot") === false) {
    // Prefer Sandpack default index; only set if custom
  }

  // Extra components under /src/components → /components
  for (const [path, content] of Object.entries(files)) {
    if (path.includes("node_modules")) continue;
    if (/\/src\/App\.tsx$/i.test(path) || /\/App\.tsx$/i.test(path)) continue;
    if (/styles?\.css$/i.test(path) || /index\.css$/i.test(path)) continue;
    if (/package\.json|vite\.config|index\.html|tsconfig/i.test(path)) continue;

    let spPath = path.startsWith("/") ? path : `/${path}`;
    spPath = spPath.replace(/^\/src\//, "/");
    if (spPath.endsWith(".tsx") || spPath.endsWith(".ts") || spPath.endsWith(".jsx") || spPath.endsWith(".js") || spPath.endsWith(".css")) {
      out[spPath] = content;
    }
  }

  return out;
}
