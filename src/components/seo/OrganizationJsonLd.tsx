import { CONTACT_EMAIL } from "@/lib/brand-email";
import { LINKEDIN_COMPANY_URL, YOUTUBE_CHANNEL_URL } from "@/lib/brand-social";
import { getLeadTrainer } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function OrganizationJsonLd() {
  const trainer = getLeadTrainer();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "EducationalOrganization"],
    name: "Verlin Labs",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/images/hero-side.jpg`,
    description:
      "Clarity-first AI training in India — mental models, live sessions, and hands-on programs for students, engineers, and product managers.",
    email: CONTACT_EMAIL,
    areaServed: "IN",
    founder: {
      "@type": "Person",
      name: "Aman Munjal",
      jobTitle: "Founder & Lead Instructor",
      url: trainer.linkedin,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: "English",
    },
    sameAs: [
      LINKEDIN_COMPANY_URL,
      YOUTUBE_CHANNEL_URL,
      `${SITE_ORIGIN}/testimonials`,
      `${SITE_ORIGIN}/newsletter`,
    ],
    knowsAbout: [
      "Artificial intelligence training",
      "Mental models for technology",
      "Product management and AI",
      "Large language models",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}