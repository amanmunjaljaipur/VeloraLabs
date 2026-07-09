import { LINKEDIN_COMPANY_URL, YOUTUBE_CHANNEL_URL } from "@/lib/brand-social";
import { SITE_ORIGIN } from "@/lib/seo";

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Verlin Labs",
    alternateName: ["Verlin Labs AI Education", "Verlin Labs India"],
    url: SITE_ORIGIN,
    description:
      "Verlin Labs — clarity-first AI training in India. Free sessions, mental models, library guides, and live programs for students, engineers, and product managers.",
    inLanguage: "en-IN",
    about: [
      "Artificial intelligence education",
      "Mental models for complex technology",
      "Live online AI workshops in India",
    ],
    keywords:
      "AI training India, mental models, LLM courses, AI for students, AI for engineers, AI for product managers",
    publisher: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    sameAs: [LINKEDIN_COMPANY_URL, YOUTUBE_CHANNEL_URL],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/library?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}