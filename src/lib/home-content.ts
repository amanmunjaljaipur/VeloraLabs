import type { AccordionItem } from "@/components/ui/Accordion";
import { BRAND_MEDIA } from "@/lib/brand-media";

export const HOME_HERO = {
  headline: "Verlin Labs - clarity-first learning for the AI age",
  subheadline:
    "Master the frameworks that matter. Free 2-hour live session and hands-on programs for students, engineers, and product managers.",
  illustration: BRAND_MEDIA.homeHero.image,
  illustrationAlt: BRAND_MEDIA.homeHero.alt,
  video: BRAND_MEDIA.homeHero.video,
};

export const WHAT_WE_COVER = [
  "Mental Models",
  "AI Fundamentals",
  "Live Workshops",
  "Hands-on Projects",
  "LLMs & Transformers",
  "Product Discovery",
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Discover",
    description: "Join a free session and explore.",
    icon: "calendar",
  },
  {
    step: 2,
    title: "Understand",
    description: "Learn mental models and core concepts.",
    icon: "brain",
  },
  {
    step: 3,
    title: "Build",
    description: "Create real AI projects hands-on from day one.",
    icon: "wrench",
  },
  {
    step: 4,
    title: "Showcase",
    description: "Present your project on Demo Day.",
    icon: "rocket",
  },
] as const;

export const HOW_IT_WORKS_ILLUSTRATION = {
  src: BRAND_MEDIA.homeJourney.image,
  alt: BRAND_MEDIA.homeJourney.alt,
  video: BRAND_MEDIA.homeJourney.video,
};

export const LEARNING_ILLUSTRATIONS = {
  mentalModels: {
    src: BRAND_MEDIA.homeMentalModels.image,
    alt: BRAND_MEDIA.homeMentalModels.alt,
    video: BRAND_MEDIA.homeMentalModels.video,
  },
  handsOn: {
    src: BRAND_MEDIA.homeHandsOn.image,
    alt: BRAND_MEDIA.homeHandsOn.alt,
    video: BRAND_MEDIA.homeHandsOn.video,
  },
} as const;

export const HOME_FAQS: AccordionItem[] = [
  {
    question: "Is the free session really free?",
    answer:
      "Yes - completely free with no hidden fees. We want you to experience our teaching style before considering the full course. No credit card is required to book.",
  },
  {
    question: "What is a mental model?",
    answer:
      "A mental model is a simple framework that helps you understand how something works. Instead of memorizing facts, you learn the structure behind AI systems - so new topics feel familiar instead of overwhelming.",
  },
  {
    question: "Do I need any prior AI knowledge?",
    answer:
      "No. We start from clarity-first foundations and adapt depth to your track - students, engineers, or product managers. Bring curiosity; we handle the structure.",
  },
  {
    question: "How is this different from YouTube or courses?",
    answer:
      "Most content dumps information. Verlin Labs teaches through live mental models, audience-tailored pacing, hands-on exercises, and mentor Q&A - so understanding sticks and you know what to do next.",
  },
  {
    question: "Can I join if I'm a complete beginner?",
    answer:
      "Absolutely. The student track and free session are designed for first exposure to AI. We use plain language, visual frameworks, and no jargon until the idea itself is clear.",
  },
  {
    question: "What happens after the free session?",
    answer:
      "You'll receive a summary, resource starter pack, and optional next steps. If the full program fits your goals, we'll share enrollment details - no pressure and no hard sell.",
  },
  {
    question: "Who is this for?",
    answer:
      "School students (Classes 6–12), college engineers, and product managers. When you book, you select your track so examples and pace match your background.",
  },
  {
    question: "Can I reschedule my session?",
    answer:
      "Yes. Use the link in your confirmation email to reschedule up to 24 hours before your session.",
  },
];

export const TESTIMONIAL_AVATARS: Record<string, string> = {
  "Priya Sharma": "/images/avatar-priya-sharma.jpg",
  "Arjun Mehta": "/images/avatar-arjun-mehta.jpg",
  "Sarah Chen": "/images/avatar-sarah-chen.jpg",
  "Rajesh Kumar": "/images/avatar-rajesh-kumar.jpg",
  "David Okonkwo": "/images/avatar-david-okonkwo.jpg",
  "Maria Gonzalez": "/images/avatar-maria-gonzalez.jpg",
};

export const FREE_SESSION_ILLUSTRATION = {
  src: BRAND_MEDIA.freeSession.image,
  alt: BRAND_MEDIA.freeSession.alt,
  video: BRAND_MEDIA.freeSession.video,
};
