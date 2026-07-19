import { editionSlug, formatWeekLabel, getWeekOfSunday } from "@/lib/news-week";

export interface NewsletterStory {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  imageUrl?: string;
  mentalModelTip: string;
  category: string;
  publishedAt: string;
}

export interface NewsletterDraftContent {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  intro: string;
  stories: NewsletterStory[];
  html: string;
  markdown: string;
  status: "draft" | "sent";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMentalModelTip(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (/\b(agent|autonom|tool|workflow)\b/.test(text)) {
    return "Mental model: Feedback loops - ask what the system measures, who corrects errors, and where humans stay in the loop.";
  }
  if (/\b(model|llm|gpt|gemini|claude|reasoning)\b/.test(text)) {
    return "Mental model: Compression lens - separate capability gains from marketing language; map claims to inputs, outputs, and failure modes.";
  }
  if (/\b(safety|alignment|regulat|policy|ethic)\b/.test(text)) {
    return "Mental model: Trade-off framing - every AI advance shifts speed, quality, cost, and risk; name which lever moved.";
  }
  if (/\b(data|dataset|train|fine-tun)\b/.test(text)) {
    return "Mental model: Information pipeline - trace where data enters, how it is filtered, and what biases survive into the product.";
  }
  return "Mental model: Clarity-first - translate the headline into one decision your team or study plan should update this week.";
}

function storyCardHtml(story: NewsletterStory, index: number): string {
  const image = story.imageUrl
    ? `<div class="overflow-hidden rounded-xl border border-border"><img src="${escapeHtml(story.imageUrl)}" alt="" class="h-48 w-full object-cover" loading="lazy" /></div>`
    : `<div class="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-text-secondary">Image unavailable</div>`;

  return `
    <article class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      ${image}
      <div class="p-6">
        <p class="text-xs font-medium uppercase tracking-wide text-teal">${escapeHtml(story.source)} · ${escapeHtml(story.category)}</p>
        <h3 class="mt-2 text-xl font-semibold text-foreground">${index}. ${escapeHtml(story.title)}</h3>
        <p class="mt-3 text-sm leading-relaxed text-text-secondary">${escapeHtml(story.summary)}</p>
        <div class="mt-4 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-foreground">
          <span class="font-medium text-teal">Clarity lens</span>
          <p class="mt-1">${escapeHtml(story.mentalModelTip)}</p>
        </div>
        <a href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex text-sm font-medium text-teal hover:underline">
          Read full story →
        </a>
      </div>
    </article>
  `;
}

export function compileRichNewsletterDraft(
  stories: NewsletterStory[],
  options?: { intro?: string; draftId?: string }
): NewsletterDraftContent {
  const now = new Date().toISOString();
  const weekLabel = formatWeekLabel(getWeekOfSunday());
  const intro =
    options?.intro ??
    "A clarity-first digest of the week's AI shifts - framed with mental models so students, engineers, and professionals can act, not just read.";

  const title = `Verlin Labs AI Weekly - ${weekLabel}`;
  const cards = stories.map((story, i) => storyCardHtml(story, i + 1)).join("");

  const html = `
    <div class="newsletter-rich mx-auto max-w-3xl">
      <header class="mb-10 rounded-2xl border border-teal/20 bg-gradient-to-br from-teal/10 via-background to-background p-8">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Verlin Labs Newsletter</p>
        <h1 class="mt-3 text-3xl font-semibold text-foreground md:text-4xl">${escapeHtml(title)}</h1>
        <p class="mt-4 text-base leading-relaxed text-text-secondary">${escapeHtml(intro)}</p>
      </header>
      <div class="grid gap-8">${cards}</div>
      <footer class="mt-10 rounded-2xl border border-border bg-muted/30 px-6 py-5 text-center text-sm text-text-secondary">
        Curated for Verlin Labs learners · <a href="/newsletter" class="text-teal hover:underline">Subscribe for more</a>
      </footer>
    </div>
  `;

  const markdown = [
    `# ${title}`,
    "",
    intro,
    "",
    ...stories.flatMap((story, i) => [
      `## ${i + 1}. ${story.title}`,
      "",
      story.summary,
      "",
      `**Clarity lens:** ${story.mentalModelTip}`,
      "",
      story.url ? `[Read more](${story.url})` : "",
      "",
    ]),
  ].join("\n");

  return {
    id: options?.draftId ?? `draft-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    title,
    intro,
    stories,
    html,
    markdown,
    status: "draft",
  };
}

export function draftToEditionSlug(draft: NewsletterDraftContent): string {
  const weekOf = getWeekOfSunday();
  const suffix = draft.id.replace(/\D/g, "").slice(-6) || Date.now().toString().slice(-6);
  return editionSlug(weekOf, suffix);
}