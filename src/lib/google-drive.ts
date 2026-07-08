export function extractGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /\/file\/d\/([^/]+)/i,
    /[?&]id=([^&]+)/i,
    /\/document\/d\/([^/]+)/i,
    /\/presentation\/d\/([^/]+)/i,
    /\/spreadsheets\/d\/([^/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("drive.google.com") || host.includes("docs.google.com");
  } catch {
    return false;
  }
}

export function inferDocumentType(url: string): "pdf" | "doc" | "slides" | "link" {
  const lower = url.toLowerCase();
  if (lower.includes("/presentation/") || lower.includes("slides")) return "slides";
  if (lower.includes("/document/") || lower.includes("docs.google.com/document")) return "doc";
  if (lower.includes(".pdf") || lower.includes("/file/")) return "pdf";
  return "link";
}

export function buildGoogleDriveLearnerUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url.trim();
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export async function fetchGoogleDriveTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VerlinLabsBot/1.0",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const html = await res.text();
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    const raw = ogTitle ?? titleTag;
    if (!raw) return null;

    return raw
      .replace(/\s*-\s*Google Drive\s*$/i, "")
      .replace(/\s*-\s*Google Docs\s*$/i, "")
      .replace(/\s*-\s*Google Slides\s*$/i, "")
      .trim();
  } catch {
    return null;
  }
}

export async function fetchPublicDocumentSnippet(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VerlinLabsBot/1.0", Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return (
      html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1]?.trim() ??
      html.match(/name="description"\s+content="([^"]+)"/i)?.[1]?.trim() ??
      null
    );
  } catch {
    return null;
  }
}