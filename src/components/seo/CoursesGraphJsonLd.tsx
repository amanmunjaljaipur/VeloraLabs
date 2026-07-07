import { buildCoursesGraphJsonLd } from "@/lib/course-schema";

/** Rich Course + ItemList @graph for /courses and /programs catalog pages. */
export function CoursesGraphJsonLd() {
  const jsonLd = buildCoursesGraphJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}