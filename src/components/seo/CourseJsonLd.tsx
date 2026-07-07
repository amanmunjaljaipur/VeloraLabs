import type { Audience, AudienceSlug, CourseContent } from "@/lib/content";
import { buildCourseJsonLd } from "@/lib/course-schema";

export function CourseJsonLd({
  slug,
  course,
  audience,
}: {
  slug: AudienceSlug;
  course: CourseContent;
  audience: Audience;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    ...buildCourseJsonLd({ slug, course, audience }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}