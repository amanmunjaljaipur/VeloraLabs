import {
  getAllCourseTracks,
  getAudience,
  type Audience,
  type AudienceSlug,
  type CourseContent,
} from "@/lib/content";
import { LINKEDIN_COMPANY_URL, YOUTUBE_CHANNEL_URL } from "@/lib/brand-social";
import { SITE_ORIGIN } from "@/lib/seo";

export const COURSE_DURATION_DAYS: Record<AudienceSlug, number> = {
  students: 8,
  engineers: 10,
  professionals: 16,
};

export function parsePriceInr(price: string): string | undefined {
  const parsed = price.replace(/[^\d.]/g, "");
  return parsed || undefined;
}

export function syllabusTopics(course: CourseContent): string[] {
  return course.phases.flatMap((phase) =>
    phase.days.flatMap((day) => day.topics ?? [day.title])
  );
}

export function buildCourseJsonLd({
  slug,
  course,
  audience,
}: {
  slug: AudienceSlug;
  course: CourseContent;
  audience: Audience;
}) {
  const price = parsePriceInr(course.price);
  const teaches = syllabusTopics(course);
  const dayCount = course.phases.reduce((sum, phase) => sum + phase.days.length, 0);
  const landingPath =
    slug === "students"
      ? "/ai-for-students"
      : slug === "engineers"
        ? "/ai-for-engineers"
        : "/ai-for-pms";

  return {
    "@type": "Course",
    "@id": `${SITE_ORIGIN}/courses/${slug}#course`,
    name: course.title,
    description: course.description,
    url: `${SITE_ORIGIN}/courses/${slug}`,
    image: `${SITE_ORIGIN}${audience.image}`,
    inLanguage: "en-IN",
    courseCode: `verlin-${slug}`,
    courseMode: "online",
    educationalLevel: audience.shortTitle,
    timeRequired: `P${COURSE_DURATION_DAYS[slug]}D`,
    numberOfCredits: dayCount,
    teaches,
    syllabusSections: course.phases.map((phase) => ({
      "@type": "Syllabus",
      name: phase.title,
      description: phase.days.map((d) => d.title).join("; "),
      timeRequired: `P${phase.days.length}D`,
    })),
    audience: {
      "@type": "EducationalAudience",
      audienceType: audience.title,
    },
    provider: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
      sameAs: [YOUTUBE_CHANNEL_URL, LINKEDIN_COMPANY_URL],
    },
    instructor: {
      "@type": "Person",
      name: "Aman Munjal",
      jobTitle: "Founder & Lead Instructor",
      url: `${SITE_ORIGIN}/about`,
      sameAs: "https://www.linkedin.com/in/aman-munjal-52745469/",
      worksFor: { "@type": "Organization", name: "Verlin Labs", url: SITE_ORIGIN },
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      name: `${course.title} - live online cohort`,
      courseMode: "online",
      courseWorkload: course.duration,
      inLanguage: "en-IN",
      instructor: {
        "@type": "Person",
        name: "Aman Munjal",
        url: `${SITE_ORIGIN}/about`,
      },
    },
    offers: {
      "@type": "Offer",
      ...(price ? { price, priceCurrency: "INR" } : { price: "0", priceCurrency: "INR" }),
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}/courses/${slug}`,
      category: audience.shortTitle,
      seller: { "@type": "Organization", name: "Verlin Labs" },
    },
    isPartOf: {
      "@type": "ItemList",
      name: "Verlin Labs AI training courses",
      url: `${SITE_ORIGIN}/courses`,
    },
    mainEntityOfPage: `${SITE_ORIGIN}${landingPath}`,
  };
}

export function buildCoursesGraphJsonLd() {
  const tracks = getAllCourseTracks();
  const courses = tracks.map(({ slug, course }) => {
    const audience = getAudience(slug)!;
    return buildCourseJsonLd({ slug, course, audience });
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...courses,
      {
        "@type": "ItemList",
        "@id": `${SITE_ORIGIN}/courses#catalog`,
        name: "Verlin Labs AI training courses",
        url: `${SITE_ORIGIN}/courses`,
        numberOfItems: courses.length,
        itemListElement: tracks.map(({ slug }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: { "@id": `${SITE_ORIGIN}/courses/${slug}#course` },
        })),
      },
    ],
  };
}