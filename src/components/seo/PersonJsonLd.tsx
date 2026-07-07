import { getLeadTrainer } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function PersonJsonLd() {
  const trainer = getLeadTrainer();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: trainer.name,
    jobTitle: trainer.title,
    description: trainer.tagline,
    image: `${SITE_ORIGIN}${trainer.image}`,
    url: `${SITE_ORIGIN}/about`,
    worksFor: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    knowsAbout: trainer.expertise,
    sameAs: [trainer.linkedin, "https://youtube.com/@verlinlabs"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}