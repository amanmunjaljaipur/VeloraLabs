import { CONTACT_EMAIL } from "@/lib/brand-email";
import { SITE_ORIGIN } from "@/lib/seo";

export function ContactPageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Verlin Labs",
    description:
      "Contact Verlin Labs for free AI session bookings, program enrollment, and corporate workshop inquiries. Based in India with responses within 24–48 hours on weekdays.",
    url: `${SITE_ORIGIN}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
      email: CONTACT_EMAIL,
      areaServed: "IN",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        availableLanguage: "English",
        areaServed: "IN",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}