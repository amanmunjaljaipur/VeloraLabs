import { readCmsJson, writeCmsJson } from "@/lib/cms/store";

export interface RichPageContent {
  title: string;
  subtitle: string;
  bodyHtml: string;
  seoDescription: string;
}

const DEFAULT_RICH: RichPageContent = {
  title: "",
  subtitle: "",
  bodyHtml: "<p>Start writing your page content here.</p>",
  seoDescription: "",
};

export function readRichPageContent(filename: string): RichPageContent {
  const data = readCmsJson<Partial<RichPageContent>>(filename);
  return { ...DEFAULT_RICH, ...data };
}

export function writeRichPageContent(filename: string, content: RichPageContent): void {
  writeCmsJson(filename, content);
}

export function parseMarkdownFrontmatter(raw: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const frontmatter: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] ?? "" };
}

export function markdownBodyToHtml(body: string): string {
  return body
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) return `<h2>${inlineMd(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${inlineMd(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").map((line) => `<li>${inlineMd(line.slice(2))}</li>`);
        return `<ul>${items.join("")}</ul>`;
      }
      return `<p>${inlineMd(trimmed.replace(/\n/g, " "))}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function htmlToMarkdownBody(html: string): string {
  return html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildMarkdownFromRich(title: string, subtitle: string, bodyHtml: string): string {
  const lines = ["---"];
  if (title) lines.push(`title: ${title}`);
  if (subtitle) lines.push(`subtitle: ${subtitle}`);
  lines.push("---", "", htmlToMarkdownBody(bodyHtml));
  return lines.join("\n");
}

function inlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}