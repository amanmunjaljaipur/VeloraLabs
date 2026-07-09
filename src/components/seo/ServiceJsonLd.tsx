import { CONTACT_EMAIL } from "@/lib/brand-email";
import { SITE_ORIGIN } from "@/lib/seo";

export function ServiceJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Corporate AI Literacy Workshops",
    description:
      "Tailored corporate AI training for teams in India — live workshops on mental models, responsible AI, LLM fundamentals, and practical evaluation frameworks.",
    provider: {
      "@type": "EducationalOrganization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
      email: CONTACT_EMAIL,
      areaServed: "IN",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: "Corporate AI training and workshops",
    audience: {
      "@type": "Audience",
      audienceType: "Business teams, engineering cohorts, product leaders",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}/contact`,
      priceCurrency: "INR",
    },
    url: `${SITE_ORIGIN}/corporate`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}