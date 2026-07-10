import type { StudioFileMap } from "@/lib/app-studio/types";

/**
 * Parse LLM output into a file map.
 * Accepts:
 * - JSON { "files": { "/path": "content" } }
 * - XML-like <file path="...">content</file>
 */
export function parseStudioFiles(raw: string): StudioFileMap {
  const files: StudioFileMap = {};

  // JSON object with files
  try {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const text = (fenced?.[1] ?? raw).trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end + 1)) as {
        files?: StudioFileMap;
        fileMap?: StudioFileMap;
      };
      const map = parsed.files || parsed.fileMap;
      if (map && typeof map === "object") {
        for (const [path, content] of Object.entries(map)) {
          if (typeof content === "string") {
            files[normalizePath(path)] = content;
          }
        }
        if (Object.keys(files).length) return files;
      }
    }
  } catch {
    // fall through
  }

  // <file path="...">...</file>
  const fileTag =
    /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  let m: RegExpExecArray | null;
  while ((m = fileTag.exec(raw)) !== null) {
    files[normalizePath(m[1])] = m[2].replace(/^\n/, "").replace(/\n$/, "");
  }
  if (Object.keys(files).length) return files;

  // ```path\ncode```
  const pathFence = /```([^\n`]+)\n([\s\S]*?)```/g;
  while ((m = pathFence.exec(raw)) !== null) {
    const label = m[1].trim();
    if (/^(json|tsx?|jsx?|css|html|bash|text)$/i.test(label)) continue;
    if (label.includes("/") || label.includes(".")) {
      files[normalizePath(label)] = m[2];
    }
  }

  return files;
}

export function mergeFiles(
  base: StudioFileMap,
  patch: StudioFileMap
): StudioFileMap {
  return { ...base, ...patch };
}

function normalizePath(path: string): string {
  let p = path.trim().replace(/\\/g, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  // strip leading src labels like "tsx:src/App.tsx"
  p = p.replace(/^\/(?:tsx|ts|jsx|js|css|html):/i, "/");
  return p;
}

/** Apply simple unified-diff style replacements if model returns full file content only. */
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
