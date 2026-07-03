import { editionSlug, formatWeekLabel } from "@/lib/news-week";

export interface NewsUpdateItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category?: string;
  submittedAt: string;
}

export interface CompiledNewsletter {
  editionId: string;
  weekOf: string;
  slug: string;
  title: string;
  intro: string;
  markdown: string;
  html: string;
  itemCount: number;
  publishedAt: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemMarkdown(item: NewsUpdateItem, index: number): string {
  const lines = [`### ${index}. ${item.title}`, "", item.summary];
  if (item.url) lines.push("", `[Read more →](${item.url})`);
  if (item.source) lines.push("", `*Source: ${item.source}*`);
  return lines.join("\n");
}

function itemHtml(item: NewsUpdateItem, index: number): string {
  const title = escapeHtml(item.title);
  const summary = escapeHtml(item.summary);
  const link = item.url
    ? `<p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Read more →</a></p>`
    : "";
  const source = item.source
    ? `<p class="text-sm text-text-secondary"><em>Source: ${escapeHtml(item.source)}</em></p>`
    : "";
  return `<article class="mb-8"><h3 class="text-xl font-semibold text-foreground">${index}. ${title}</h3><p class="mt-2 text-text-secondary leading-relaxed">${summary}</p>${link}${source}</article>`;
}

export function compileNewsletterEdition(
  weekOf: string,
  items: NewsUpdateItem[],
  options?: { intro?: string; publishedAt?: string }
): CompiledNewsletter {
  const weekLabel = formatWeekLabel(weekOf);
  const intro =
    options?.intro ??
    "Your weekly clarity-first roundup of AI and technology — curated for builders, students, and professionals.";
  const publishedAt = options?.publishedAt ?? new Date().toISOString();
  const editionId = `edition-${weekOf}`;
  const slug = editionSlug(weekOf);
  const title = `Verlin Labs Weekly — ${weekLabel}`;

  const bodyMarkdown = items.map((item, i) => itemMarkdown(item, i + 1)).join("\n\n");
  const markdown = [
    `# ${title}`,
    "",
    `*${intro}*`,
    "",
    "## This week's highlights",
    "",
    bodyMarkdown,
    "",
    "---",
    "",
    "*You're receiving this because you follow Verlin Labs. [Subscribe on our site](/newsletter) for more.*",
  ].join("\n");

  const bodyHtml = items.map((item, i) => itemHtml(item, i + 1)).join("");
  const html = [
    `<header class="mb-10"><p class="text-sm font-medium uppercase tracking-wide text-teal">Sunday Newsletter</p>`,
    `<h1 class="mt-2 text-3xl font-semibold text-foreground md:text-4xl">${escapeHtml(title)}</h1>`,
    `<p class="mt-4 text-lg text-text-secondary">${escapeHtml(intro)}</p></header>`,
    `<section><h2 class="mb-6 text-2xl font-semibold text-foreground">This week's highlights</h2>${bodyHtml}</section>`,
  ].join("");

  return {
    editionId,
    weekOf,
    slug,
    title,
    intro,
    markdown,
    html,
    itemCount: items.length,
    publishedAt,
  };
}