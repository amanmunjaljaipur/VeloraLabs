import type { AudienceSlug } from "@/lib/content";
import { createMetadata } from "@/lib/seo";

/** Keyword-rich SERP titles & descriptions — unique per route; descriptions target 150–160 chars. */
export const PAGE_SEO = {
  home: {
    title: "Verlin Labs — AI Training & Mental Models for Students, Engineers & PMs",
    description:
      "Verlin Labs — live AI training in India with free 2-hour sessions, mental models, LLM courses, and hands-on programs for school students, college engineers, and product managers.",
    keywords: [
      "AI training India",
      "AI course India",
      "AI classes for students",
      "AI training for engineers",
      "AI training for product managers",
      "mental models AI",
      "learn AI online India",
      "LLM course India",
      "free AI workshop",
      "Verlin Labs",
      "AI education platform India",
      "hands-on AI programs",
    ],
  },
  courses: {
    title: "AI Courses for Students, Engineers & Product Managers",
    description:
      "Compare Verlin Labs AI courses — live sessions, mental models, capstone demo day, and INR pricing for school students, college engineers, and product managers in India.",
    keywords: [
      "AI courses India",
      "AI learning tracks",
      "AI course for students",
      "AI course for engineers",
      "AI course for PMs",
      "live AI classes",
      "Verlin Labs courses",
    ],
  },
  programs: {
    title: "AI Programs & Live Learning Tracks",
    description:
      "Explore Verlin Labs AI programs — free intro session, student/engineer/PM tracks, corporate workshops, mental models, and demo-day capstones across India.",
    keywords: [
      "AI programs India",
      "AI workshops India",
      "live AI training",
      "corporate AI literacy",
      "student AI program",
      "engineer AI bootcamp",
      "PM AI program",
      "Verlin Labs programs",
    ],
  },
  freeSession: {
    title: "Free 2-Hour AI Intro Session — Book Live",
    description:
      "Book a free 2-hour live AI intro session at Verlin Labs India — mental models, hands-on exercises, mentor Q&A, and a personalized learning path. No credit card.",
    keywords: [
      "free AI session",
      "free AI workshop India",
      "free AI class online",
      "AI intro session",
      "book AI demo class",
      "Verlin Labs free session",
    ],
  },
  students: {
    title: "AI Training for School Students (Classes 6–12)",
    description:
      "AI training for school students at Verlin Labs India — safe tool use, mental models, live sessions, showcase projects, and parent-friendly clarity for Classes 6–12.",
    keywords: [
      "AI training for students",
      "AI course for school students",
      "AI classes for kids India",
      "AI for Classes 6-12",
      "learn AI safely students",
      "student AI program India",
    ],
  },
  engineers: {
    title: "AI Training for College Engineers & CS Students",
    description:
      "AI training for college engineers at Verlin Labs — LLM fundamentals, RAG, portfolio projects, interview prep, and live mental-model sessions for CS students in India.",
    keywords: [
      "AI training for engineers",
      "AI course for CS students",
      "LLM course India",
      "RAG course students",
      "AI portfolio projects",
      "engineer AI bootcamp India",
    ],
  },
  professionals: {
    title: "AI Training for Product Managers",
    description:
      "AI training for product managers at Verlin Labs — evaluate vendors, run AI-assisted discovery, ship MVPs, and lead teams in a 16-day live program with demo day.",
    keywords: [
      "AI training for product managers",
      "AI course for PMs",
      "AI product management training",
      "LLM for product discovery",
      "non-technical PM AI",
      "AI MVP for PMs",
    ],
  },
  corporate: {
    title: "Corporate AI Literacy Workshops for Teams",
    description:
      "Corporate AI literacy workshops from Verlin Labs India — tailored team training, responsible AI frameworks, live Q&A, hands-on exercises, and manager follow-up resources.",
    keywords: [
      "corporate AI training India",
      "AI workshop for teams",
      "enterprise AI literacy",
      "company AI enablement",
      "leadership AI workshop",
      "Verlin Labs corporate",
    ],
  },
  appBuilder: {
    title: "App Builder Lab — Prompt to Production for Students & PMs",
    description:
      "Verlin Labs App Builder Lab: turn one product idea into a brief, opinionated stack, and deploy checklist. Student training first — not magic codegen.",
    keywords: [
      "AI app builder for students",
      "product management AI training",
      "prompt to product brief",
      "learn to ship software India",
      "PM app builder lab",
      "Verlin Labs App Builder",
    ],
  },
  mentalModels: {
    title: "AI Mental Models — Frameworks That Stick",
    description:
      "Free AI mental models from Verlin Labs — visual frameworks for LLMs, transformers, RAG, and complex tech. In-depth guides for students, engineers, and PMs in India.",
    keywords: [
      "AI mental models",
      "learn AI frameworks",
      "understand LLMs",
      "transformer mental model",
      "RAG explained",
      "AI frameworks for beginners",
      "how LLMs work guide",
    ],
  },
  library: {
    title: "AI Learning Library — Long-Form Guides & Articles",
    description:
      "Free AI library from Verlin Labs — long-form guides on product management, LLM fundamentals, RAG, prompt design, and mental models for learners in India.",
    keywords: [
      "how to learn AI for product management",
      "AI guides India",
      "AI articles students",
      "learn AI online",
      "LLM tutorials",
      "AI learning resources",
      "Verlin Labs library",
    ],
  },
  blog: {
    title: "AI Blog — Clarity-First Insights & Updates",
    description:
      "Verlin Labs AI blog — practical mental models, product thinking, engineering explainers, and technology updates for students, engineers, and PMs in India.",
    keywords: [
      "AI blog India",
      "AI insights",
      "technology blog India",
      "mental models blog",
      "AI product thinking",
    ],
  },
  testimonials: {
    title: "Learner Reviews & Testimonials",
    description:
      "Reviews from Verlin Labs learners — students, engineers, PMs, and parents on mental models, live AI sessions, and training programs across India.",
    keywords: [
      "Verlin Labs reviews",
      "AI course testimonials",
      "learner feedback India",
      "AI training reviews",
    ],
  },
  about: {
    title: "About Verlin Labs — Clarity-First AI Education",
    description:
      "About Verlin Labs — clarity-first AI education in India founded by Aman Munjal. Mental models, live sessions, and programs for students, engineers, and PMs.",
    keywords: [
      "about Verlin Labs",
      "Aman Munjal AI educator",
      "AI educator India",
      "clarity-first learning",
      "Verlin Labs founder",
    ],
  },
  contact: {
    title: "Contact Verlin Labs — Sessions & Corporate Programs",
    description:
      "Contact Verlin Labs India for free AI sessions, enrollments, and corporate workshops. Email contact@verlinlabs.com — replies within 24–48 hours on weekdays.",
    keywords: [
      "contact Verlin Labs",
      "book AI session India",
      "corporate AI inquiry",
      "Verlin Labs email",
      "AI training contact",
    ],
  },
  faq: {
    title: "AI Training FAQ — Sessions, Programs & Pricing",
    description:
      "FAQ about Verlin Labs AI training — free sessions, course tracks, INR pricing, enrollment, rescheduling, IST scheduling, and our mental-model teaching approach.",
    keywords: [
      "AI training FAQ",
      "Verlin Labs FAQ",
      "free AI session questions",
      "AI course pricing India",
      "how to enroll Verlin Labs",
    ],
  },
  newsletter: {
    title: "AI Newsletter — Weekly Mental Models & Clarity",
    description:
      "Subscribe to the Verlin Labs newsletter — weekly mental models, AI news roundups, and clarity-first insights for students, engineers, and PMs in India.",
    keywords: [
      "AI newsletter India",
      "weekly AI insights",
      "Verlin Labs newsletter",
      "AI mental models weekly",
    ],
  },
  resources: {
    title: "Free AI Resources — Downloads & Toolkits",
    description:
      "Free AI resources from Verlin Labs — session workbooks, mental model cheat sheets, glossaries, and curated tool lists for clarity-first learners in India.",
    keywords: [
      "free AI resources",
      "AI downloads India",
      "AI learning toolkit",
      "mental model cheat sheet",
      "AI glossary PDF",
    ],
  },
  terms: {
    title: "Terms of Service — Verlin Labs Programs",
    description:
      "Verlin Labs terms of service for website use, free AI sessions, and paid training programs for students, engineers, and product managers in India.",
    keywords: ["Verlin Labs terms", "AI course terms India"],
  },
  privacy: {
    title: "Privacy Policy — How We Protect Your Data",
    description:
      "Verlin Labs privacy policy — how we collect, use, and protect data when you book sessions, enroll in AI courses, or contact us. Aligned with India DPDP practices.",
    keywords: ["Verlin Labs privacy", "AI course data protection", "DPDP India"],
  },
  refundPolicy: {
    title: "Refund & Cancellation Policy",
    description:
      "Refund and cancellation terms for Verlin Labs free sessions and paid AI programs in INR — rescheduling rules and enrollment policies before you sign up.",
    keywords: ["Verlin Labs refund", "AI course cancellation India"],
  },
  sitemap: {
    title: "Site Map — Browse All Verlin Labs Pages",
    description:
      "Browse every Verlin Labs page — AI courses, mental models, library guides, free sessions, corporate workshops, testimonials, legal pages, and company info.",
    keywords: ["Verlin Labs sitemap", "AI training site map"],
  },
  newsletterWeekly: {
    title: "Weekly AI Roundup — Latest Newsletter Edition",
    description:
      "Read the latest Verlin Labs weekly newsletter — curated AI news, mental models, and clarity-first analysis for students, engineers, and PMs in India.",
    keywords: ["AI weekly roundup", "Verlin Labs newsletter edition", "AI news India"],
  },
  newsletterArchive: {
    title: "Newsletter Archive — Weekly AI Editions",
    description:
      "Browse every Verlin Labs weekly newsletter edition — clarity-first AI roundups organized by Sunday week in India Standard Time (IST).",
    keywords: ["AI newsletter archive", "weekly AI editions", "Verlin Labs newsletter history"],
  },
  aiForStudents: {
    title: "AI for Students — Classes 6–12 AI Training India",
    description:
      "AI for school students at Verlin Labs India — mental models, safe AI tool use, live sessions, showcase projects, and an 8-day program. Start with a free session.",
    keywords: [
      "AI for students India",
      "AI classes for kids",
      "school student AI training",
      "Classes 6-12 AI course",
      "safe AI learning students",
    ],
  },
  aiForPms: {
    title: "AI for Product Managers — Training & MVP Building",
    description:
      "AI for product managers at Verlin Labs — evaluate tools, run discovery, ship AI MVPs, and lead teams in a 16-day live program with capstone demo day in India.",
    keywords: [
      "AI for product managers",
      "AI training for PMs India",
      "AI product management course",
      "PM AI MVP",
      "non-technical PM AI roadmap",
    ],
  },
  aiForEngineers: {
    title: "AI for Engineers — LLM Training & Portfolio Projects",
    description:
      "AI for college engineers at Verlin Labs — LLM fundamentals, RAG, portfolio projects, interview prep, and a 10-day live program with mental models in India.",
    keywords: [
      "AI for engineers India",
      "LLM course for students",
      "CS student AI training",
      "RAG projects portfolio",
      "AI interview prep engineers",
    ],
  },
  hubLlmsProductDiscovery: {
    title: "How to Use LLMs for Product Discovery — PM Hub",
    description:
      "How PMs use LLMs for product discovery — interview synthesis, theme clustering, PRDs, and verification habits. Verlin Labs hub with live program links for India.",
    keywords: [
      "LLMs for product discovery",
      "AI product discovery",
      "PM AI workflow",
      "ChatGPT for PMs",
      "AI user research synthesis",
    ],
  },
  hubAiRoadmapPms: {
    title: "AI Roadmap for Non-Technical Product Managers",
    description:
      "AI learning roadmap for non-technical PMs — literacy, vendor evaluation, and MVP shipping without a CS degree. Links to Verlin Labs 16-day PM program in India.",
    keywords: [
      "AI roadmap for PMs",
      "non-technical PM AI",
      "AI training product managers",
      "PM AI literacy path",
    ],
  },
  hubAiSchoolStudents: {
    title: "AI Learning Roadmap for School Students (Classes 6–12)",
    description:
      "How school students learn AI safely in India — mental models, age-appropriate tools, showcase projects, free session, and 8-day Verlin Labs student program.",
    keywords: [
      "AI for school students",
      "AI classes kids India",
      "learn AI safely students",
      "student AI roadmap",
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

export function noIndexMetadata(title: string, description: string, path: string) {
  return createMetadata({
    title,
    description,
    path,
    noIndex: true,
  });
}