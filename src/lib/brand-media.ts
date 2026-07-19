/**
 * Verlin Labs brand media
 *
 * Home hero: original neural brain (no people, no text).
 * Select pages: high-quality clips with LARGE locked text (muted only).
 * Abstract films elsewhere - no face-only stock spam, no tiny hazy captions.
 */

export type BrandMediaKey =
  | "homeHero"
  | "homeMentalModels"
  | "homeHandsOn"
  | "homeJourney"
  | "freeSession"
  | "about"
  | "courses"
  | "library"
  | "programs"
  | "corporate"
  | "faq"
  | "mentalModelsHub"
  | "testimonials"
  | "contact";

export interface BrandMediaAsset {
  image: string;
  alt: string;
  video?: string;
}

export const BRAND_MEDIA: Record<BrandMediaKey, BrandMediaAsset> = {
  /** Original brain film - user favorite */
  homeHero: {
    image: "/images/hero-home-visual.jpg",
    video: "/videos/hero-neural.mp4",
    alt: "Neural pathways visualization for clarity-first learning",
  },
  /** Custom on-brand illustration (2026 revamp) - replaces generic stock video with a
   *  purpose-built diagram of the section's actual message: scattered tools -> Information/Framework/Clarity. */
  homeMentalModels: {
    image: "/images/brand-mental-models-framework-v2.jpg",
    alt: "Mental models, not tool lists - a dozen scattered tools converging into one reusable Information, Framework, Clarity core",
  },
  homeHandsOn: {
    image: "/images/brand-hands-on.jpg",
    video: "/videos/hands-on.mp4",
    alt: "Modular pieces assembling into a working project",
  },
  /** Switched from video to a static infographic - 2025 revamp (faster load, clearer read) */
  homeJourney: {
    image: "/images/brand-journey-infographic.jpg",
    alt: "Four-stage learning path: Discover, Learn, Practice, Apply",
  },
  freeSession: {
    image: "/images/brand-free-session.jpg",
    video: "/videos/free-session.mp4",
    alt: "Soft live-session product atmosphere",
  },
  about: {
    image: "/images/brand-journey.jpg",
    video: "/videos/about.mp4",
    alt: "Abstract path of clarity-first learning",
  },
  /** Improved from session 21 - large CHOOSE YOUR TRACK labels */
  /** New poster art for the 2025 emerald/gold revamp - matches the current palette */
  courses: {
    image: "/images/brand-courses-tracks.jpg",
    video: "/videos/courses.mp4",
    alt: "Choose your track - Students, Engineers, Product Managers",
  },
  /** Switched from video to a static illustration - 2025 revamp */
  library: {
    image: "/images/brand-library-catalog.jpg",
    alt: "Knowledge organizing into a catalog structure",
  },
  /** Improved from session 43 - large program card titles */
  programs: {
    image: "/images/hq-programs.jpg",
    video: "/videos/programs.mp4",
    alt: "Programs - Free intro, Full tracks, Team workshops",
  },
  corporate: {
    image: "/images/brand-hands-on.jpg",
    video: "/videos/corporate.mp4",
    alt: "Network of shared team literacy",
  },
  /** Switched from video to a static illustration - 2025 revamp */
  faq: {
    image: "/images/brand-faq-illustration.jpg",
    alt: "Structure emerging from open questions",
  },
  /** Custom on-brand illustration (2026 revamp) - three fanned framework cards. */
  mentalModelsHub: {
    image: "/images/brand-mental-models-hub.jpg",
    alt: "Reusable frameworks - Systems, Trade-offs, and Mental Models, the three lenses applied to every new problem",
  },
  /** Improved from session 18 - large WHAT LEARNERS SAY */
  testimonials: {
    image: "/images/hq-testimonials.jpg",
    video: "/videos/testimonials.mp4",
    alt: "What learners say",
  },
  /** Switched from video to a static illustration - 2025 revamp */
  contact: {
    image: "/images/brand-contact-illustration.jpg",
    alt: "Let us talk - We reply within 24 hours",
  },
};

export const BRAND_OG_IMAGE = BRAND_MEDIA.homeHero.image;
export const PAGE_AMBIENT_IMAGE = BRAND_MEDIA.contact.image;
