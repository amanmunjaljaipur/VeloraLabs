import { PageHeader } from "@/components/layout/PageHeader";
import { getLibraryItems } from "@/lib/content";
import { createMetadata } from "@/lib/seo";
import { BlogClient } from "./BlogClient";

export const metadata = createMetadata({
  title: "Blog",
  description:
    "Articles, guides, and insights on AI, mental models, and technology from Verlin Labs.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = getLibraryItems().filter((item) =>
    ["Article", "Guide"].includes(item.type)
  );

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Ideas worth understanding"
        subtitle="Clarity-first articles on AI fundamentals, product thinking, and the mental models that make complex technology stick."
        align="center"
        compact
      />
      <BlogClient posts={posts} />
    </>
  );
}