import { AudienceLandingPage } from "@/components/sections/AudienceLandingPage";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { getAudienceLanding } from "@/lib/audience-landing";
import { getAudience, getCourseTrack } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";

const config = getAudienceLanding("engineers");

export const metadata = staticPageMetadata("aiForEngineers", config.path);

export default function AiForEngineersPage() {
  const audience = getAudience("engineers")!;
  const course = getCourseTrack("engineers");

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "AI for Engineers" },
  ];

  return (
    <>
      <CourseJsonLd slug="engineers" course={course} audience={audience} />
      <FaqPageJsonLd items={config.faqs} path={config.path} />
      <HowToJsonLd
        name={config.howToName}
        description={config.howToDescription}
        path={config.path}
        steps={config.howToSteps}
        totalTime="P10D"
      />
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={config.path} />
      <AudienceLandingPage config={config} breadcrumbs={breadcrumbs} />
    </>
  );
}