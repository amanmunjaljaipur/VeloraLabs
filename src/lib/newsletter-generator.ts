import crypto from "crypto";
import { saveNewsletterDraft } from "@/lib/newsletter-draft";
import {
  buildMentalModelTip,
  compileRichNewsletterDraft,
  type NewsletterDraftContent,
  type NewsletterStory,
} from "@/lib/newsletter-rich-compile";
import { fetchLatestAiStories, fetchStoryImage } from "@/lib/newsletter-rss";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=80",
  "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=900&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
];

export async function generateNewsletterDraftFromWeb(): Promise<NewsletterDraftContent> {
  const rssStories = await fetchLatestAiStories(5);
  if (rssStories.length === 0) {
    throw new Error("Could not fetch AI news from the internet. Try again in a few minutes.");
  }

  const stories: NewsletterStory[] = await Promise.all(
    rssStories.map(async (story, index) => {
      const imageUrl =
        (await fetchStoryImage(story.link)) ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

      return {
        id: `story-${crypto.randomUUID()}`,
        title: story.title,
        summary: story.summary,
        url: story.link,
        source: story.source,
        imageUrl,
        mentalModelTip: buildMentalModelTip(story.title, story.summary),
        category: "AI & Technology",
        publishedAt: story.publishedAt,
      };
    })
  );

  const draft = compileRichNewsletterDraft(stories);
  await saveNewsletterDraft(draft);
  return draft;
}