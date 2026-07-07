import { buildArticleAuthorJsonLd } from "@/lib/article-author";
import type { LibraryItem } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function ArticleJsonLd({ item }: { item: LibraryItem }) {
  const coursePath =
    item.audience === "students"
      ? "/courses/students"
      : item.audience === "engineers"
        ? "/courses/engineers"
        : item.audience === "professionals"
          ? "/courses/professionals"
          : "/courses";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.description,
    author: buildArticleAuthorJsonLd(),
    publisher: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/images/hero-side.jpg`,
      },
    },
    datePublished: item.publishedAt,
    ...(item.updatedAt ? { dateModified: item.updatedAt } : {}),
    image: `${SITE_ORIGIN}${item.image}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/library/${item.slug}`,
    },
    keywords: item.tags.join(", "),
    about: item.tags,
    isPartOf: {
      "@type": "WebSite",
      name: "Verlin Labs Learning Library",
      url: `${SITE_ORIGIN}/library`,
    },
    ...(item.audience !== "all"
      ? {
          educationalUse: "Professional development",
          learningResourceType: item.type,
          teaches: item.tags,
          hasPart: {
            "@type": "Course",
            url: `${SITE_ORIGIN}${coursePath}`,
            provider: { "@type": "Organization", name: "Verlin Labs" },
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}