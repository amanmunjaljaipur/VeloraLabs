import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { ContactExpectations, ContactReassurance } from "@/components/sections/ContactFaq";
import { ContactHero } from "@/components/sections/ContactHero";
import { WaysToConnect } from "@/components/sections/WaysToConnect";
import { staticPageMetadata } from "@/lib/page-metadata";
import { ContactForm } from "./ContactForm";
import { Suspense } from "react";

export const metadata = staticPageMetadata("contact", "/contact");

export default function ContactPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Contact" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/contact" />
      <ContactHero />
      <WaysToConnect />
      <section className="border-t border-border bg-muted/10 py-16 md:py-24">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
      <ContactExpectations />
      <ContactReassurance />
      <SiteExploreLinks section="programs" title="Explore programs" limit={4} />
      <SiteExploreLinks section="company" excludeHref="/contact" limit={2} />
    </>
  );
}