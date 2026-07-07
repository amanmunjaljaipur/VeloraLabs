import { getLeadTrainer } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/seo";

export function getArticleAuthor() {
  const trainer = getLeadTrainer();
  return {
    name: trainer.name,
    title: trainer.title,
    tagline: trainer.tagline,
    image: trainer.image,
    imageAlt: trainer.imageAlt,
    bio: trainer.bio[0],
    linkedin: trainer.linkedin,
    profileUrl: `${SITE_ORIGIN}/about`,
    credentials: trainer.credentials,
    expertise: trainer.expertise,
  };
}

export function buildArticleAuthorJsonLd() {
  const author = getArticleAuthor();
  return {
    "@type": "Person",
    name: author.name,
    jobTitle: author.title,
    description: author.tagline,
    image: `${SITE_ORIGIN}${author.image}`,
    url: author.profileUrl,
    sameAs: [author.linkedin, "https://youtube.com/@verlinlabs"],
    worksFor: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    knowsAbout: author.expertise,
  };
}