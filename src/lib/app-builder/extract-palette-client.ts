/**
 * Client-only: sample dominant colours from an image file or URL via canvas.
 * Used before calling theme-from-image API.
 */

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image for colours"));
    img.src = src;
  });
}

/**
 * Extract up to `max` hex colours from an image (file or URL / data URL).
 */
export async function extractPaletteFromImageSource(
  source: string | File,
  max = 6
): Promise<string[]> {
  let src: string;
  let revoke: string | null = null;
  if (typeof source === "string") {
    src = source;
  } else {
    src = URL.createObjectURL(source);
    revoke = src;
  }

  try {
    const img = await loadImage(src);
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    // Quantize to 4-bit channels and count
    const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Skip near-transparent-looking greys that are pure white/black noise
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const prev = buckets.get(key);
      if (prev) {
        prev.n += 1;
        prev.r += r;
        prev.g += g;
        prev.b += b;
      } else {
        buckets.set(key, { n: 1, r, g, b });
      }
    }

    const sorted = [...buckets.values()]
      .map((v) => ({
        n: v.n,
        hex: rgbToHex(v.r / v.n, v.g / v.n, v.b / v.n),
        lum: (0.299 * (v.r / v.n) + 0.587 * (v.g / v.n) + 0.114 * (v.b / v.n)) / 255,
      }))
      .filter((v) => v.lum > 0.06 && v.lum < 0.94)
      .sort((a, b) => b.n - a.n);

    const out: string[] = [];
    for (const c of sorted) {
      if (out.length >= max) break;
      // Avoid near-duplicates
      const tooClose = out.some((h) => colourDistance(h, c.hex) < 28);
      if (!tooClose) out.push(c.hex);
    }
    return out.length ? out : sorted.slice(0, max).map((c) => c.hex);
  } finally {
    if (revoke) URL.revokeObjectURL(revoke);
  }
}

function colourDistance(a: string, b: string): number {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  return Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
}

/** Upload image to shop admin API; returns public URL */
export async function uploadAppImage(
  slug: string,
  file: File,
  kind: "product" | "logo" | "theme" | "image" = "image"
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const res = await fetch(`/api/apps/${slug}/admin/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Upload failed");
  }
  return data.url;
}
