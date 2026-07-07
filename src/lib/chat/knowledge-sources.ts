import { getSiteFaqCategories } from "@/lib/cms/faq-content-data";
import { getHomeContentData } from "@/lib/cms/home-content-data";
import {
  getAllCourseTracks,
  getAudiences,
  getFreeSession,
  getSiteConfig,
} from "@/lib/content";
import { buildIntroOfferSummary, getIntroPricing } from "@/lib/pricing";
import type { KnowledgeEntry } from "./types";

const CONTACT_FAQS = [
  {
    question: "How quickly will I get a reply?",
    answer:
      "We aim to respond within 24–48 hours on business days. Urgent free-session scheduling questions are usually faster — often the same day.",
    category: "Contact",
  },
  {
    question: "Can I book a session directly?",
    answer:
      "Yes. For the fastest path to a free 2-hour session, use our booking page. The contact form is best for custom questions, teams, or partnerships.",
    category: "Contact",
    links: [{ label: "Book free session", href: "/free-session" }],
  },
  {
    question: "Do you offer corporate or team training?",
    answer:
      "Yes. We run clarity-first workshops for teams — tailored examples, live Q&A, and follow-up resources. Mention your team size and goals in the contact form.",
    category: "Contact",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    question: "Is there a physical office I can visit?",
    answer:
      "Verlin Labs programs are delivered online. Sessions use video conferencing so learners can join from anywhere with a stable connection.",
    category: "Contact",
  },
  {
    question: "Will you try to sell me a paid program?",
    answer:
      "No pressure. We'll answer your question honestly. Paid enrollment is discussed only if it's genuinely relevant to your goals — many people use only the free session and library resources.",
    category: "Contact",
  },
  {
    question: "What should I include in my message?",
    answer:
      "Your background, what you're trying to learn or solve, team size (if applicable), and any timeline. The more context you share, the more useful our reply will be.",
    category: "Contact",
    links: [{ label: "Contact form", href: "/contact" }],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildKeywords(question: string, answer: string, category: string, extra?: string[]): string[] {
  const words = new Set([...tokenize(question), ...tokenize(answer), ...tokenize(category), ...(extra ?? [])]);
  return Array.from(words);
}

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function collectLegacyKnowledgeEntries(): KnowledgeEntry[] {
  const site = getSiteConfig();
  const entries: KnowledgeEntry[] = [];
  const seen = new Set<string>();

  function add(entry: Omit<KnowledgeEntry, "id" | "keywords"> & { keywords?: string[]; extraKeywords?: string[] }) {
    const key = normalizeQuestion(entry.question);
    if (seen.has(key)) return;
    seen.add(key);

    entries.push({
      id: slugify(entry.question) || `entry-${entries.length}`,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      keywords: entry.keywords ?? buildKeywords(entry.question, entry.answer, entry.category, entry.extraKeywords),
      links: entry.links,
      bullets: entry.bullets,
    });
  }

  add({
    question: "What is Verlin Labs?",
    answer: `${site.name} — ${site.description}`,
    category: "General",
    links: [{ label: "About Verlin Labs", href: "/about" }],
    extraKeywords: ["verlin", "labs", "company", "platform", "who", "what"],
  });

  add({
    question: "How do I book the free session?",
    answer:
      "Visit the Free Session page, pick a time slot on the calendar, and confirm your booking. You'll get an immediate confirmation and calendar invite by email. No credit card required.",
    category: "Free Session",
    links: [{ label: "Book free session", href: "/free-session" }],
    extraKeywords: ["book", "schedule", "reserve", "signup", "sign up", "register"],
  });

  add({
    question: "What are the course prices?",
    answer: buildPricingAnswer(),
    category: "Pricing",
    links: [{ label: "View courses", href: "/courses" }],
    extraKeywords: ["price", "cost", "fee", "rupees", "inr", "discount", "offer", "how much"],
  });

  add({
    question: "What is the introductory pricing offer?",
    answer: buildIntroOfferSummary(),
    category: "Pricing",
    links: [{ label: "View courses", href: "/courses" }],
    extraKeywords: ["intro", "introductory", "sale", "70", "percent", "off", "pricing", "model"],
  });

  add({
    question: "What is a mental model?",
    answer:
      "A mental model is a simple framework that helps you understand how something works. Instead of memorizing facts, you learn the structure behind AI systems — so new topics feel familiar instead of overwhelming.",
    category: "Learning",
    links: [{ label: "Mental Models", href: "/mental-models" }],
    extraKeywords: ["framework", "structure", "understand", "mental", "model"],
  });

  for (const cat of getSiteFaqCategories()) {
    for (const item of cat.items) {
      add({
        question: item.question,
        answer: item.answer,
        category: cat.title,
        bullets: item.bullets,
        links: categoryLinks(cat.id),
      });
    }
  }

  for (const item of getHomeContentData().homeFaqs) {
    add({
      question: item.question,
      answer: item.answer,
      category: "Home",
      bullets: item.bullets,
    });
  }

  const freeSession = getFreeSession();
  for (const cat of freeSession.faqCategories) {
    for (const item of cat.items) {
      add({
        question: item.question,
        answer: item.answer.trim(),
        category: cat.title,
        bullets: item.bullets,
        links: [{ label: "Book free session", href: "/free-session" }],
      });
    }
  }

  for (const item of CONTACT_FAQS) {
    add({
      question: item.question,
      answer: item.answer,
      category: item.category,
      links: item.links,
    });
  }

  for (const audience of getAudiences()) {
    add({
      question: `Who is the ${audience.shortTitle} track for?`,
      answer: `${audience.heroTitle}. ${audience.heroSubtitle}`,
      category: "Courses",
      links: [{ label: audience.shortTitle, href: `/courses/${audience.slug}` }],
      extraKeywords: [audience.slug, ...tokenize(audience.title)],
    });
  }

  for (const { slug, course } of getAllCourseTracks()) {
    const pricing = getIntroPricing(course.price);
    add({
      question: `Tell me about the ${course.title} program`,
      answer: `${course.description}\n\n**Duration:** ${course.duration}\n\n**Introductory price:** ${pricing.current} (list ${pricing.original}, ${pricing.discountPercent}% off)`,
      category: "Courses",
      links: [{ label: "View program", href: `/courses/${slug}` }],
      extraKeywords: [slug, course.title, course.duration, pricing.current],
    });
  }

  add({
    question: "Where can I read articles and guides?",
    answer:
      "The Library has clarity-first articles on AI fundamentals, LLMs, transformers, and more. Mental Models covers reusable frameworks. The blog shares weekly insights.",
    category: "Resources",
    links: [
      { label: "Library", href: "/library" },
      { label: "Mental Models", href: "/mental-models" },
      { label: "Blog", href: "/blog" },
    ],
    extraKeywords: ["article", "read", "learn", "content", "guide"],
  });

  add({
    question: "How do I subscribe to the newsletter?",
    answer: site.newsletter.description,
    category: "Newsletter",
    links: [{ label: "Subscribe", href: "/newsletter" }],
    extraKeywords: ["newsletter", "subscribe", "email", "updates", "weekly"],
  });

  add({
    question: "How do I contact Verlin Labs?",
    answer:
      "Use the contact form for custom questions, team training, or partnerships. For booking a free session, use the Free Session page directly for fastest scheduling.",
    category: "Contact",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Book free session", href: "/free-session" },
    ],
    extraKeywords: ["contact", "email", "reach", "talk", "support", "help"],
  });

  return entries;
}

function buildPricingAnswer(): string {
  return "All full programs currently have an introductory discount off list price. See the table below for each track.";
}

function categoryLinks(categoryId: string) {
  switch (categoryId) {
    case "free-session":
      return [{ label: "Book free session", href: "/free-session" }];
    case "programs":
      return [{ label: "View courses", href: "/courses" }];
    case "teams":
      return [{ label: "Contact for teams", href: "/contact" }];
    default:
      return [{ label: "Full FAQ", href: "/faq" }];
  }
}