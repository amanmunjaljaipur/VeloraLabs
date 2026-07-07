export interface CmsTextField {
  path: string;
  label: string;
  value: string;
  multiline: boolean;
}

const SKIP_KEYS = new Set(["id", "slug", "href", "embedding", "version", "builtAt"]);

function labelFromPath(path: string): string {
  const last = path.split(".").pop() ?? path;
  return last
    .replace(/\[(\d+)\]/g, " $1 ")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shouldEditString(key: string, value: string): boolean {
  if (SKIP_KEYS.has(key)) return false;
  if (value.length > 2000) return false;
  if (/^https?:\/\//i.test(value) && !/\s/.test(value)) return false;
  if (/^\/[a-z0-9/_-]+$/i.test(value) && value.length < 80) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  if (/^[a-f0-9-]{36}$/i.test(value)) return false;
  return true;
}

export function extractTextFields(node: unknown, prefix = ""): CmsTextField[] {
  if (!node || typeof node !== "object") return [];

  if (Array.isArray(node)) {
    return node.flatMap((item, index) => extractTextFields(item, `${prefix}[${index}]`));
  }

  const fields: CmsTextField[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string" && shouldEditString(key, value)) {
      fields.push({
        path,
        label: labelFromPath(path),
        value,
        multiline: value.length > 120 || value.includes("\n"),
      });
      continue;
    }

    if (typeof value === "object" && value !== null) {
      fields.push(...extractTextFields(value, path));
    }
  }

  return fields;
}

export function applyTextFields(base: unknown, updates: Array<{ path: string; value: string }>): unknown {
  const clone = structuredClone(base) as Record<string, unknown>;

  for (const { path, value } of updates) {
    const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    let current: Record<string, unknown> = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const next = current[part];
      if (!next || typeof next !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]!] = value;
  }

  return clone;
}