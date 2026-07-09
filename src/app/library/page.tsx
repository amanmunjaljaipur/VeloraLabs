import { getLearnContentLastUpdated, getLibraryItems } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";
import { CollectionPageJsonLd } from "@/components/seo/CollectionPageJsonLd";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { LIBRARY_SEO_BLOCK } from "@/lib/seo-content";
import { LibraryClient } from "./LibraryClient";

export const metadata = staticPageMetadata("library", "/library");

export default function LibraryPage() {
  const items = getLibraryItems();
  const lastUpdated = getLearnContentLastUpdated();
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
      <LibraryClient items={items} lastUpdated={lastUpdated} />
      <SeoRichTextSection block={LIBRARY_SEO_BLOCK} />
    </>
  );
}