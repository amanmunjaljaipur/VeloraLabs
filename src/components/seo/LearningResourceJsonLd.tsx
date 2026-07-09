import { SITE_ORIGIN } from "@/lib/seo";

export function LearningResourceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url: `${SITE_ORIGIN}${path}`,
    learningResourceType: "Downloadable toolkit",
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}