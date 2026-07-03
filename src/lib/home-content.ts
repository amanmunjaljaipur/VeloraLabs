import type { AccordionItem } from "@/components/ui/Accordion";

export const HOME_HERO = {
  headline: "Clarity-first learning for the AI age",
  subheadline:
    "Clear mental models for complex AI ideas. Free 2-hour sessions and hands-on programs for students, engineers, and PMs.",
  illustration: "/images/hero-illustration.jpg",
  illustrationAlt:
    "Illustration of complex ideas transforming into clear mental model frameworks through connected pathways",
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
    title: "Join Free Session",
    description: "Book a free 2-hour intro matched to your background.",
    icon: "calendar",
  },
  {
    step: 2,
    title: "Learn Mental Models",
    description: "Learn frameworks you can reuse — not facts to memorize.",
    icon: "brain",
  },
  {
    step: 3,
    title: "Hands-on Practice",
    description: "Practice with real tools and mentor feedback.",
    icon: "wrench",
  },
  {
    step: 4,
    title: "Build & Demo",
    description: "Ship a project, present it, and plan your next step.",
    icon: "rocket",
  },
] as const;

export const HOW_IT_WORKS_ILLUSTRATION = {
  src: "/images/how-it-works-timeline.jpg",
  alt: "Four-step learning journey from free session through mental models, hands-on practice, to build and demo",
};

export const LEARNING_ILLUSTRATIONS = {
  mentalModels: {
    src: "/images/mental-models-map-illustration.jpg",
    alt: "Complex ideas transforming into clear mental model frameworks",
  },
  handsOn: {
    src: "/images/hands-on-mvp-illustration.jpg",
    alt: "Student presenting a hands-on project at demo day",
  },
} as const;

export const HOME_FAQS: AccordionItem[] = [
  {
    question: "Is the free session really free?",
    answer:
      "Yes — completely free with no hidden fees. We want you to experience our teaching style before considering the full course. No credit card is required to book.",
  },
  {
    question: "What is a mental model?",
    answer:
      "A mental model is a simple framework that helps you understand how something works. Instead of memorizing facts, you learn the structure behind AI systems — so new topics feel familiar instead of overwhelming.",
  },
  {
    question: "Do I need any prior AI knowledge?",
    answer:
      "No. We start from clarity-first foundations and adapt depth to your track — students, engineers, or product managers. Bring curiosity; we handle the structure.",
  },
  {
    question: "How is this different from YouTube or courses?",
    answer:
      "Most content dumps information. Verlin Labs teaches through live mental models, audience-tailored pacing, hands-on exercises, and mentor Q&A — so understanding sticks and you know what to do next.",
  },
  {
    question: "Can I join if I'm a complete beginner?",
    answer:
      "Absolutely. The student track and free session are designed for first exposure to AI. We use plain language, visual frameworks, and no jargon until the idea itself is clear.",
  },
  {
    question: "What happens after the free session?",
    answer:
      "You'll receive a summary, resource starter pack, and optional next steps. If the full program fits your goals, we'll share enrollment details — no pressure and no hard sell.",
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
  src: "/images/free-session-live-illustration.jpg",
  alt: "Live online session with instructor teaching and engaged students",
};
