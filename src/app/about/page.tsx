import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { TrainerProfile } from "@/components/sections/TrainerProfile";
import { getLeadTrainer, getMarkdownPage } from "@/lib/content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { staticPageMetadata } from "@/lib/page-metadata";
import { TrustSignals } from "@/components/sections/TrustSignals";

export const metadata = staticPageMetadata("about", "/about");

export default async function AboutPage() {
  const { frontmatter, html } = await getMarkdownPage("about.md");
  const trainer = getLeadTrainer();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "About" },
  ];

  return (
    <>
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/about" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="About us"
        title={(frontmatter.title as string) || "About Verlin Labs"}
        subtitle={frontmatter.subtitle as string}
        align="center"
        compact
      />
      <section className="section-y">
        <div
          className="prose-verlin mx-auto max-w-3xl px-4 md:px-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
      <TrainerProfile trainer={trainer} />
      <TrustSignals compact />
      <SiteExploreLinks section="programs" excludeHref="/about" />
      <SiteExploreLinks section="company" excludeHref="/about" limit={3} />
    </>
  );
}