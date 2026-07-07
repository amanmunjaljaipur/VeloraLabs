import { buildCoursesGraphJsonLd } from "@/lib/course-schema";
import { SITE_ORIGIN } from "@/lib/seo";

/** @deprecated Prefer CoursesGraphJsonLd — kept for imports that pass listPath. */
export function CoursesCatalogJsonLd({ listPath = "/courses" }: { listPath?: string } = {}) {
  const jsonLd = buildCoursesGraphJsonLd();
  if (listPath !== "/courses" && jsonLd["@graph"]) {
    const list = jsonLd["@graph"].find(
      (node) => typeof node === "object" && node !== null && node["@type"] === "ItemList"
    ) as { url?: string } | undefined;
    if (list) list.url = `${SITE_ORIGIN}${listPath}`;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}