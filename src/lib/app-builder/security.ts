/**
 * Security helpers for App Builder tenants and media.
 */

import type { AppCapability } from "@/lib/app-builder/tenant-types";

/** Capabilities that may appear on non-owner roles */
export const SAFE_APP_CAPABILITIES: AppCapability[] = [
  "products.view",
  "products.edit",
  "orders.view",
  "orders.manage",
  "customers.view",
  "customers.manage",
  "team.view",
  "team.manage",
  "roles.manage",
  "settings.edit",
  "analytics.view",
  "shop.browse",
  "orders.own",
  "profile.edit",
  "inquiries.manage",
];

const SAFE_SET = new Set<string>(SAFE_APP_CAPABILITIES);

/** Strip capabilities that are not in the allow-list; never allow * except for super_admin */
export function sanitizeCapabilities(
  caps: unknown,
  opts?: { allowStar?: boolean }
): AppCapability[] {
  if (!Array.isArray(caps)) return [];
  const out: AppCapability[] = [];
  for (const c of caps) {
    if (typeof c !== "string") continue;
    if (c === "*") {
      if (opts?.allowStar) out.push("*");
      continue;
    }
    if (SAFE_SET.has(c)) out.push(c as AppCapability);
  }
  return [...new Set(out)];
}

/**
 * Minimal HTML sanitizer for owner-authored about pages.
 * Blocks scripts, handlers, and common XSS vectors (not a full DOMPurify).
 */
export function sanitizeShopHtml(html: string, maxLen = 20_000): string {
  let s = String(html || "").slice(0, maxLen);
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<\/?(?:iframe|object|embed|link|meta|base)\b[^>]*>/gi, "");
  s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript:/gi, "");
  s = s.replace(/vbscript:/gi, "");
  s = s.replace(/data:text\/html/gi, "");
  return s;
}

/** Safe image / logo URLs only (https or known image data URLs) */
export function isSafeMediaUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  if (!u) return false;
  if (
    u.startsWith("data:image/jpeg") ||
    u.startsWith("data:image/png") ||
    u.startsWith("data:image/webp") ||
    u.startsWith("data:image/gif") ||
    u.startsWith("data:image/jpg")
  ) {
    // Reject SVG-in-data and huge payloads
    if (u.length > 2_000_000) return false;
    if (/svg/i.test(u.slice(0, 64))) return false;
    return true;
  }
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:") return true;
    // Local/dev only
    if (parsed.protocol === "http:" && process.env.NODE_ENV !== "production") return true;
    return false;
  } catch {
    return false;
  }
}

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_IMAGE_MIME.has((mime || "").toLowerCase());
}

/** Magic-byte check so Content-Type spoofing cannot upload SVG/HTML as image */
export function detectImageKind(buf: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  // RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function clientIpFromRequest(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function clampOrderItems(
  items: Array<{ productId?: string; name?: string; price?: string; qty?: number }>
): Array<{ productId: string; name: string; price: string; qty: number }> {
  return items
    .slice(0, 20)
    .map((it) => ({
      productId: String(it.productId || "").slice(0, 64),
      name: String(it.name || "Item").slice(0, 120),
      price: String(it.price || "").slice(0, 32),
      qty: Math.min(99, Math.max(1, Math.floor(Number(it.qty) || 1))),
    }))
    .filter((it) => it.name);
}
