import { getLearnContentLastUpdated, getLibraryItems } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";
import { CollectionPageJsonLd } from "@/components/seo/CollectionPageJsonLd";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { LIBRARY_SEO_BLOCK } from "@/lib/seo-content";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { BRAND_MEDIA } from "@/lib/brand-media";
import { LibraryClient } from "./LibraryClient";

export const metadata = staticPageMetadata("library", "/library");

export default function LibraryPage() {
  const items = getLibraryItems();
  const lastUpdated = getLearnContentLastUpdated();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Library" },
  ];
  return (
    <>
      <CollectionPageJsonLd
        name="Verlin Labs AI Learning Library"
        description={LIBRARY_SEO_BLOCK.paragraphs[0]!}
        path="/library"
        items={items.map((item) => ({
          name: item.title,
          url: `/library/${item.slug}`,
          description: item.summary || item.description,
        }))}
      />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/library" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Learn"
        title="AI Learning Library"
        subtitle="Articles, guides, and workshops on mental models, LLMs, and hands-on AI skills."
        image={BRAND_MEDIA.library.image}
        imageAlt={BRAND_MEDIA.library.alt}
        compact
      />
      <LibraryClient items={items} lastUpdated={lastUpdated} />
      <SeoRichTextSection block={LIBRARY_SEO_BLOCK} />
    </>
  );
}