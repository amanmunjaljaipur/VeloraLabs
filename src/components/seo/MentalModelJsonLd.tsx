import type { MentalModel } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function MentalModelJsonLd({ model }: { model: MentalModel }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: model.name,
    description: model.shortDescription,
    learningResourceType: "Mental model",
    educationalLevel: model.difficulty,
    timeRequired: model.readTime,
    url: `${SITE_ORIGIN}/mental-models/${model.slug}`,
    provider: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    image: `${SITE_ORIGIN}/images/mental-models-map-illustration.jpg`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}