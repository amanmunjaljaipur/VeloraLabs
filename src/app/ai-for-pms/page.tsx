import { AudienceLandingPage } from "@/components/sections/AudienceLandingPage";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { getAudienceLanding } from "@/lib/audience-landing";
import { getAudience, getCourseTrack } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";

const config = getAudienceLanding("professionals");

export const metadata = staticPageMetadata("aiForPms", config.path);

export default function AiForPmsPage() {
  const audience = getAudience("professionals")!;
  const course = getCourseTrack("professionals");

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "AI for PMs" },
  ];

  return (
    <>
      <CourseJsonLd slug="professionals" course={course} audience={audience} />
      <FaqPageJsonLd items={config.faqs} path={config.path} />
      <HowToJsonLd
        name={config.howToName}
        description={config.howToDescription}
        path={config.path}
        steps={config.howToSteps}
        totalTime="P16D"
      />
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={config.path} />
      <AudienceLandingPage config={config} breadcrumbs={breadcrumbs} />
    </>
  );
}