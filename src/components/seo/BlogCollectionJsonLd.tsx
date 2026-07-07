import { getLibraryItems } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function BlogCollectionJsonLd() {
  const posts = getLibraryItems().filter((item) =>
    ["Article", "Guide", "Workshop"].includes(item.type)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Verlin Labs AI Blog & Content Hub",
    description:
      "Clarity-first AI articles, guides, and explainers for students, engineers, and product managers.",
    url: `${SITE_ORIGIN}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    blogPost: posts.slice(0, 12).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: `${SITE_ORIGIN}/library/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: {
        "@type": "Organization",
        name: post.author ?? "Verlin Labs",
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}