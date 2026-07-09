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
    alternateName: ["Verlin Labs AI Education", "Verlin Labs India"],
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/icon.png`,
    image: `${SITE_ORIGIN}/images/hero-home-visual.jpg`,
    description:
      "Verlin Labs is a clarity-first AI education platform in India offering live training, mental models, free intro sessions, and hands-on programs for school students, college engineers, and product managers.",
    slogan: "Clarity-first learning for the AI age",
    email: CONTACT_EMAIL,
    foundingDate: "2025",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Rajasthan",
      addressLocality: "Jaipur",
    },
    founder: {
      "@type": "Person",
      name: "Aman Munjal",
      jobTitle: "Founder & Lead Instructor",
      url: trainer.linkedin,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: CONTACT_EMAIL,
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
      {
        "@type": "ContactPoint",
        email: CONTACT_EMAIL,
        contactType: "sales",
        areaServed: "IN",
        availableLanguage: "English",
        description: "Corporate AI workshop inquiries",
      },
    ],
    sameAs: [
      LINKEDIN_COMPANY_URL,
      YOUTUBE_CHANNEL_URL,
      `${SITE_ORIGIN}/testimonials`,
      `${SITE_ORIGIN}/newsletter`,
      `${SITE_ORIGIN}/library`,
      `${SITE_ORIGIN}/mental-models`,
    ],
    knowsAbout: [
      "Artificial intelligence training",
      "Mental models for technology",
      "Large language models",
      "Transformers and attention",
      "Retrieval-augmented generation",
      "AI product management",
      "Prompt engineering",
      "Corporate AI literacy",
      "AI education for students",
      "Live online workshops India",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Verlin Labs AI Programs",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "AI Training for School Students",
            url: `${SITE_ORIGIN}/courses/students`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "AI Training for College Engineers",
            url: `${SITE_ORIGIN}/courses/engineers`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "AI Training for Product Managers",
            url: `${SITE_ORIGIN}/courses/professionals`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Free 2-Hour AI Intro Session",
            url: `${SITE_ORIGIN}/free-session`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Corporate AI Literacy Workshops",
            url: `${SITE_ORIGIN}/corporate`,
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}