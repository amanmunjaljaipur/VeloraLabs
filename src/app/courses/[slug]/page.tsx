import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { AudienceCoursePage } from "@/components/sections/AudienceCoursePage";
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
import { getAudience, getAudiences, getCourseTrack, type AudienceSlug } from "@/lib/content";
import { InstructorsSection } from "@/components/sections/InstructorsSection";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { courseTrackMetadata } from "@/lib/page-metadata";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAudiences().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) return { title: "Not Found" };
  return courseTrackMetadata(slug as AudienceSlug, audience.image);
}

export default async function CourseTrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) notFound();

  const course = getCourseTrack(slug as AudienceSlug);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "Courses", href: "/courses" },
    { label: audience.shortTitle },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={`/courses/${slug}`} />
      <CourseJsonLd slug={slug as AudienceSlug} course={course} audience={audience} />
      <PersonJsonLd />
      <AudienceCoursePage slug={slug as AudienceSlug} course={course} />
      <InstructorsSection compact />
    </>
  );
}