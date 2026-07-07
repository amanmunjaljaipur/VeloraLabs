import { getTestimonials } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function TestimonialsJsonLd() {
  const testimonials = getTestimonials();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Verlin Labs learner testimonials",
    url: `${SITE_ORIGIN}/testimonials`,
    numberOfItems: testimonials.length,
    itemListElement: testimonials.map((testimonial, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Review",
        reviewBody: testimonial.quote,
        author: {
          "@type": "Person",
          name: testimonial.name,
          jobTitle: testimonial.role,
        },
        itemReviewed: {
          "@type": "Course",
          name: "Verlin Labs AI Training Program",
          provider: {
            "@type": "Organization",
            name: "Verlin Labs",
            url: SITE_ORIGIN,
          },
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}