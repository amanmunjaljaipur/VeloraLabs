/** Trim copy to SERP-friendly length (150–160 chars) without mid-word breaks. */
export function trimMetaDescription(text: string, max = 160): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= max) return normalized;

  const cut = normalized.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}