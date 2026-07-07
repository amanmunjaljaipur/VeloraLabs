import { SITE_ORIGIN } from "@/lib/seo";

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Verlin Labs",
    alternateName: ["Verlin Labs AI Education", "Verlin Labs India"],
    url: SITE_ORIGIN,
    description:
      "Clarity-first learning for AI and technology — mental models, free sessions, and programs for students, engineers, and product managers.",
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    sameAs: [
      "https://www.linkedin.com/in/verlin-labs-05678141b/",
      "https://youtube.com/@verlinlabs",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}