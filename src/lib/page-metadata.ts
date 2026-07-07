import type { AudienceSlug } from "@/lib/content";
import { createMetadata } from "@/lib/seo";

/** Keyword-rich SERP titles & descriptions — unique per route; descriptions target 150–160 chars. */
export const PAGE_SEO = {
  home: {
    title: "Verlin Labs — AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs — clarity-first AI training in India. Free 2-hour session, mental models, and live programs for students, engineers, and product managers.",
    keywords: [
      "AI training India",
      "AI course for students",
      "AI training for product managers",
      "mental models AI",
      "Verlin Labs",
    ],
  },
  courses: {
    title: "AI Courses for Students, Engineers & Product Managers",
    description:
      "Compare Verlin Labs AI courses for school students, college engineers, and product managers — live sessions, mental models, and capstone demo day.",
    keywords: ["AI courses", "AI learning tracks", "Verlin Labs courses"],
  },
  programs: {
    title: "AI Programs & Live Learning Tracks",
    description:
      "Explore Verlin Labs AI programs — free intro session, paid tracks for students, engineers, and PMs, plus corporate workshops across India.",
    keywords: ["AI programs", "AI workshops India", "Verlin Labs programs"],
  },
  freeSession: {
    title: "Free 2-Hour AI Intro Session — Book Live",
    description:
      "Book a free 2-hour AI intro session at Verlin Labs. Live mental models, hands-on exercises, and a personalized learning path — no credit card required.",
    keywords: ["free AI session", "free AI workshop", "AI intro class"],
  },
  students: {
    title: "AI Training for School Students (Classes 6–12)",
    description:
      "AI training for school students at Verlin Labs — mental models, safe AI tool use, live sessions, and a showcase project. Start with a free session.",
    keywords: [
      "AI training for students",
      "AI course for school students",
      "AI classes for kids India",
    ],
  },
  engineers: {
    title: "AI Training for College Engineers & CS Students",
    description:
      "AI training for college engineers at Verlin Labs — LLM fundamentals, portfolio projects, and interview prep with live mental-model sessions.",
    keywords: [
      "AI training for engineers",
      "AI course for CS students",
      "LLM course India",
    ],
  },
  professionals: {
    title: "AI Training for Product Managers",
    description:
      "AI training for product managers at Verlin Labs — evaluate tools, ship AI MVPs, and lead teams. 16-day live program with capstone demo day.",
    keywords: [
      "AI training for product managers",
      "AI course for PMs",
      "AI product management training",
    ],
  },
  corporate: {
    title: "Corporate AI Literacy Workshops for Teams",
    description:
      "Corporate AI literacy workshops from Verlin Labs — tailored for teams in India with live Q&A, responsible AI frameworks, and follow-up resources.",
    keywords: ["corporate AI training", "AI workshop for teams", "enterprise AI literacy"],
  },
  mentalModels: {
    title: "AI Mental Models — Frameworks That Stick",
    description:
      "Free AI mental models from Verlin Labs — visual frameworks to understand LLMs, transformers, and complex tech without jargon. Learn frameworks that stick.",
    keywords: ["AI mental models", "learn AI frameworks", "understand LLMs"],
  },
  library: {
    title: "AI Learning Library — Long-Form Guides & Articles",
    description:
      "Free AI guides and articles from Verlin Labs — learn AI for product management, LLM fundamentals, RAG, and mental models. Clarity-first resources.",
    keywords: [
      "how to learn AI for product management",
      "AI guides",
      "AI articles",
      "learn AI online",
    ],
  },
  blog: {
    title: "AI Blog — Clarity-First Insights & Updates",
    description:
      "Verlin Labs AI blog — practical mental models, product thinking, and technology explainers for students, engineers, and product managers in India.",
    keywords: ["AI blog", "AI insights", "technology blog India"],
  },
  testimonials: {
    title: "Learner Reviews & Testimonials",
    description:
      "Reviews from Verlin Labs learners — students, engineers, PMs, and parents on mental models, live sessions, and AI training programs across India.",
    keywords: ["Verlin Labs reviews", "AI course testimonials", "learner feedback"],
  },
  about: {
    title: "About Verlin Labs — Clarity-First AI Education",
    description:
      "About Verlin Labs — clarity-first AI education founded by Aman Munjal. Mental models, live sessions, and hands-on programs for learners across India.",
    keywords: ["about Verlin Labs", "Aman Munjal", "AI educator India"],
  },
  contact: {
    title: "Contact Verlin Labs — Sessions & Corporate Programs",
    description:
      "Contact Verlin Labs for free AI sessions, corporate workshops, and program questions. Based in India — we reply within 24–48 hours on weekdays.",
    keywords: ["contact Verlin Labs", "book AI session", "corporate AI inquiry"],
  },
  faq: {
    title: "AI Training FAQ — Sessions, Programs & Pricing",
    description:
      "FAQ about Verlin Labs AI training — free sessions, course tracks, pricing, enrollment, rescheduling, and what makes our mental-model approach different.",
    keywords: ["AI training FAQ", "Verlin Labs FAQ", "free AI session questions"],
  },
  newsletter: {
    title: "AI Newsletter — Weekly Mental Models & Clarity",
    description:
      "Subscribe to the Verlin Labs newsletter — weekly mental models, AI frameworks, and clarity-first insights for students, engineers, and PMs.",
    keywords: ["AI newsletter", "weekly AI insights", "Verlin Labs newsletter"],
  },
  resources: {
    title: "Free AI Resources — Downloads & Toolkits",
    description:
      "Free AI resources from Verlin Labs — session workbooks, mental model cheat sheets, glossaries, and curated tools for clarity-first learners in India.",
    keywords: ["free AI resources", "AI downloads", "AI learning toolkit"],
  },
  terms: {
    title: "Terms of Service — Verlin Labs Programs",
    description:
      "Verlin Labs terms of service for website use, free AI sessions, and paid training programs for students, engineers, and product managers in India.",
    keywords: ["Verlin Labs terms", "AI course terms"],
  },
  privacy: {
    title: "Privacy Policy — How We Protect Your Data",
    description:
      "Verlin Labs privacy policy — how we collect, use, and protect personal information when you book sessions, enroll in AI courses, or contact us.",
    keywords: ["Verlin Labs privacy", "data protection"],
  },
  refundPolicy: {
    title: "Refund & Cancellation Policy",
    description:
      "Refund and cancellation terms for Verlin Labs free sessions and paid AI training programs — clear policies for rescheduling before you enroll.",
    keywords: ["Verlin Labs refund", "course cancellation policy"],
  },
  sitemap: {
    title: "Site Map — Browse All Verlin Labs Pages",
    description:
      "Browse every Verlin Labs page — AI courses, mental models, library guides, free sessions, corporate workshops, testimonials, and company information.",
    keywords: ["Verlin Labs sitemap"],
  },
  newsletterWeekly: {
    title: "Weekly AI Roundup — Latest Newsletter Edition",
    description:
      "Read the latest Verlin Labs weekly newsletter — curated AI news, mental models, and clarity-first analysis for students, engineers, and PMs.",
    keywords: ["AI weekly roundup", "Verlin Labs newsletter edition"],
  },
  aiForStudents: {
    title: "AI for Students — Classes 6–12 AI Training India",
    description:
      "AI for students at Verlin Labs — mental models, safe AI tool use, live sessions, and a showcase project for Classes 6–12. Start with a free 2-hour session.",
    keywords: ["AI for students", "AI classes for kids", "AI training school students India"],
  },
  aiForPms: {
    title: "AI for Product Managers — Training & MVP Building",
    description:
      "AI for product managers at Verlin Labs — evaluate tools, run AI-assisted discovery, ship MVPs, and lead teams. 16-day live program with capstone demo day.",
    keywords: ["AI for product managers", "AI training for PMs", "AI product management course"],
  },
  aiForEngineers: {
    title: "AI for Engineers — LLM Training & Portfolio Projects",
    description:
      "AI for college engineers at Verlin Labs — LLM fundamentals, RAG, portfolio projects, and interview prep. 10-day live program with mental models and mentorship.",
    keywords: ["AI for engineers", "LLM course for students", "AI training CS students India"],
  },
  hubLlmsProductDiscovery: {
    title: "How to Use LLMs for Product Discovery — PM Hub",
    description:
      "How product managers use LLMs for discovery — interview synthesis, theme clustering, PRDs, and verification habits. Verlin Labs PM hub with live program links.",
    keywords: [
      "LLMs for product discovery",
      "AI product discovery",
      "PM AI workflow",
    ],
  },
  hubAiRoadmapPms: {
    title: "AI Roadmap for Non-Technical Product Managers",
    description:
      "AI learning roadmap for non-technical PMs — literacy, vendor evaluation, and MVP shipping without a CS degree. Links to Verlin Labs 16-day PM program.",
    keywords: [
      "AI roadmap for PMs",
      "non-technical PM AI",
      "AI training product managers",
    ],
  },
  hubAiSchoolStudents: {
    title: "AI Learning Roadmap for School Students (Classes 6–12)",
    description:
      "How school students learn AI safely — mental models, age-appropriate tool use, and showcase projects. Verlin Labs student hub with free session and 8-day program.",
    keywords: [
      "AI for school students",
      "AI classes kids India",
      "learn AI safely students",
    ],
  },
} as const;

const COURSE_SEO: Record<AudienceSlug, (typeof PAGE_SEO)[keyof typeof PAGE_SEO]> = {
  students: PAGE_SEO.students,
  engineers: PAGE_SEO.engineers,
  professionals: PAGE_SEO.professionals,
};

export function homeMetadata() {
  return createMetadata({
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    keywords: PAGE_SEO.home.keywords,
    path: "/",
    image: "/images/hero-home-visual.jpg",
    absoluteTitle: true,
  });
}

export function courseTrackMetadata(slug: AudienceSlug, image: string) {
  const seo = COURSE_SEO[slug];
  return createMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: `/courses/${slug}`,
    image,
  });
}

export function staticPageMetadata(
  key: keyof typeof PAGE_SEO,
  path: string,
  image?: string
) {
  const seo = PAGE_SEO[key];
  return createMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path,
    image,
  });
}