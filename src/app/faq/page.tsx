import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { staticPageMetadata } from "@/lib/page-metadata";
import { getSiteFaqCategories, getTotalFaqCount } from "@/lib/cms/faq-content-data";
import { FaqClient } from "./FaqClient";

export const metadata = staticPageMetadata("faq", "/faq");

export default function FaqPage() {
  const categories = getSiteFaqCategories();
  const totalCount = getTotalFaqCount();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "FAQ" },
  ];

  return (
    <>
      <FaqJsonLd categories={categories} />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/faq" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Help center"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about learning with Verlin Labs"
        image="/images/brand-free-session.jpg"
        imageAlt="Answers and guidance for Verlin Labs learners"
        video="/videos/faq.mp4"
        compact
      />

      <FaqClient categories={categories} totalCount={totalCount} />
      <SiteExploreLinks section="programs" title="Ready to start?" subtitle="Explore programs or book a free session." limit={4} />
      <SiteExploreLinks section="company" excludeHref="/faq" limit={2} />
    </>
  );
}