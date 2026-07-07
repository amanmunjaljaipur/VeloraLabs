import { SITE_ORIGIN } from "@/lib/seo";

export function FreeSessionEventJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Free 2-Hour AI Intro Session",
    description:
      "Live clarity-first AI intro session with mental models, hands-on exercises, and a personalized learning path for students, engineers, and product managers.",
    url: `${SITE_ORIGIN}/free-session`,
    image: `${SITE_ORIGIN}/images/free-session-live-illustration.jpg`,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    duration: "PT2H",
    inLanguage: "en",
    location: {
      "@type": "VirtualLocation",
      url: `${SITE_ORIGIN}/free-session`,
    },
    organizer: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    audience: [
      { "@type": "EducationalAudience", audienceType: "School students (Classes 6–12)" },
      { "@type": "EducationalAudience", audienceType: "College engineers" },
      { "@type": "EducationalAudience", audienceType: "Product managers" },
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}/free-session`,
      validFrom: "2026-01-01",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}