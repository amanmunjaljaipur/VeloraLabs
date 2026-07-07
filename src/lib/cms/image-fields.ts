export interface CmsImageField {
  path: string;
  label: string;
  value: string;
}

const SKIP_KEY_PATTERN =
  /alt$|caption$|description$|label$|title$|name$|question$|answer$|summary$|headline$|subheadline$/i;

const IMAGE_KEY_PATTERN =
  /image|illustration|photo|picture|avatar|thumb|poster|banner|cover|hero|visual|src$/i;

function labelFromPath(path: string): string {
  const cleaned = path
    .replace(/\[(\d+)\]/g, " item $1 ")
    .replace(/\./g, " › ");
  const last = cleaned.split(" › ").pop() ?? path;
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isImagePath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\/.+\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)) return true;
  if (/^\/images\//i.test(trimmed)) return true;
  if (/^\/api\/cms\/media\//i.test(trimmed)) return true;
  return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(trimmed);
}

function isImageFieldKey(key: string, value: string): boolean {
  if (SKIP_KEY_PATTERN.test(key)) return false;
  if (isImagePath(value)) return true;
  if (IMAGE_KEY_PATTERN.test(key) && (value.includes("/") || isImagePath(value))) return true;
  return false;
}

export function extractImageFields(node: unknown, prefix = ""): CmsImageField[] {
  if (!node || typeof node !== "object") return [];

  if (Array.isArray(node)) {
    return node.flatMap((item, index) => extractImageFields(item, `${prefix}[${index}]`));
  }

  const fields: CmsImageField[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string" && isImageFieldKey(key, value)) {
      fields.push({
        path,
        label: labelFromPath(path),
        value,
      });
      continue;
    }

    if (typeof value === "object" && value !== null) {
      fields.push(...extractImageFields(value, path));
    }
  }

  return fields;
}

export function applyImageField(
  base: unknown,
  path: string,
  value: string
): unknown {
  const clone = structuredClone(base) as Record<string, unknown>;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
  return clone;
}

export function getByPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}