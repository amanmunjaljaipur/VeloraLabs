import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
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
    ["Article", "Guide", "Workshop"].includes(item.type)
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Blog" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/blog" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Blog"
        title="Ideas worth understanding"
        subtitle="Clarity-first articles on AI fundamentals, product thinking, and the mental models that make complex technology stick."
        align="center"
        compact
      />
      <div className="container-verlin -mt-6 mb-2 flex justify-center">
        <p className="text-sm text-text-secondary">
          {posts.length} articles and guides ·{" "}
          <a href="/library" className="font-medium text-teal hover:underline">
            Explore full library
          </a>
        </p>
      </div>
      <BlogClient posts={posts} />
    </>
  );
}