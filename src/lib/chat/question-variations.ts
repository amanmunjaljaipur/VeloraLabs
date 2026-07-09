/**
 * Labeled question variations for chatbot training.
 * Expands each canonical Q&A with many natural phrasings so free-form chat matches better.
 */

export type VariationSeed = {
  id: string;
  question: string;
  category: string;
  alternateQuestions?: string[];
};

/** Hand-curated high-value paraphrases keyed by training entry id */
export const CURATED_ALTERNATES: Record<string, string[]> = {
  "what-is-verlin-labs": [
    "what is verlin labs",
    "tell me about verlin labs",
    "who are you",
    "what do you do",
    "what does verlin labs offer",
    "explain verlin labs",
    "about verlin labs",
    "what company is this",
    "is verlin labs a course platform",
    "what is this website for",
  ],
  "how-do-i-book-the-free-session": [
    "how to book free session",
    "how can I book the free session",
    "book free session",
    "I want to book a free session",
    "where do I register for free session",
    "how to register for free workshop",
    "booking link free session",
    "sign up for free session",
    "how do I enroll for free intro",
    "schedule free session",
  ],
  "is-the-2-hour-session-really-free": [
    "is free session free",
    "is it really free",
    "any hidden cost for free session",
    "do I need to pay for free session",
    "is the intro session free of cost",
    "free session charges",
    "will you charge me later",
    "is the 2 hour session free",
  ],
  "is-the-free-session-really-free": [
    "is free session really free",
    "any fee for free session",
    "is free workshop paid",
    "do free sessions cost money",
  ],
  "is-the-introductory-session-really-free": [
    "is intro session free",
    "introductory session cost",
    "is introductory free",
  ],
  "what-are-the-course-prices": [
    "course price",
    "how much do courses cost",
    "program cost",
    "fees",
    "rupees",
    "pricing",
    "what is the fee",
    "how much does it cost",
    "price list",
    "course fees india",
    "cost of AI course",
    "program pricing",
  ],
  "what-is-the-introductory-pricing-offer": [
    "introductory offer",
    "intro pricing",
    "70% off",
    "discount offer",
    "sale price",
    "pricing model",
    "help with pricing",
    "any discount",
    "special offer",
    "launch offer",
  ],
  "what-is-a-mental-model": [
    "mental model",
    "define mental model",
    "explain mental models",
    "what are mental models",
    "meaning of mental model",
    "why mental models for AI",
    "what is mental model learning",
  ],
  "what-does-clarity-first-learning-mean": [
    "clarity first learning",
    "what is clarity-first",
    "explain clarity first approach",
    "clarity first meaning",
    "what do you mean by clarity first",
  ],
  "is-this-suitable-for-complete-beginners": [
    "for beginners",
    "can beginners join",
    "I am a beginner",
    "no AI experience can I join",
    "suitable for beginners",
    "absolute beginner ok",
    "zero knowledge AI course",
  ],
  "can-i-join-if-i-m-a-complete-beginner": [
    "complete beginner can I join",
    "newbie friendly",
    "beginner track",
  ],
  "will-there-be-any-sales-pitch-during-the-session": [
    "sales pitch free session",
    "will you sell during free session",
    "is free session a sales call",
    "hard sell free session",
    "pushy sales",
  ],
  "what-happens-after-the-free-session": [
    "after free session",
    "next steps after free session",
    "what after free intro",
    "do I have to buy after free session",
  ],
  "what-happens-after-the-session-ends": [
    "after session ends",
    "what next after session",
    "post session process",
  ],
  "how-soon-can-i-get-a-slot": [
    "availability free session",
    "when is next free session",
    "earliest free session slot",
    "how soon can I book",
    "slots available",
  ],
  "what-s-the-difference-between-the-three-tracks": [
    "difference between tracks",
    "students vs engineers vs pms",
    "which track should I choose",
    "compare the three programs",
    "three tracks difference",
    "which course is for me",
  ],
  "how-long-are-the-programs": [
    "program duration",
    "how many days is the course",
    "course length",
    "how long does the program take",
    "duration of training",
  ],
  "do-i-get-a-certificate": [
    "certificate",
    "certification",
    "completion certificate",
    "do you give certificates",
    "will I get a certificate",
    "certificate after course",
  ],
  "can-i-switch-tracks-later": [
    "change track later",
    "switch program",
    "move from student to engineer track",
    "can I change course",
  ],
  "how-is-this-different-from-youtube-or-other-online-courses": [
    "vs youtube",
    "different from youtube",
    "why not just watch youtube",
    "how different from online courses",
    "vs udemy",
    "vs free youtube tutorials",
  ],
  "how-is-this-different-from-youtube-or-courses": [
    "youtube vs verlin labs",
    "difference from online courses",
  ],
  "do-i-need-any-technical-background": [
    "technical background required",
    "need coding skills",
    "do I need programming",
    "non technical ok",
    "need CS degree",
  ],
  "do-i-need-a-technical-or-ai-background": [
    "AI background needed",
    "prior AI knowledge",
    "technical or AI experience required",
  ],
  "do-i-need-any-prior-ai-knowledge": [
    "prior AI knowledge",
    "need to know AI already",
    "AI beginner welcome",
  ],
  "what-tools-will-i-use": [
    "which tools",
    "software used",
    "chatgpt used",
    "what AI tools",
    "tools in the program",
  ],
  "are-the-sessions-live-or-recorded": [
    "live or recorded",
    "are sessions live",
    "is it recorded",
    "live classes",
    "async or live",
  ],
  "do-you-offer-corporate-or-team-training": [
    "corporate training",
    "team training",
    "company workshop",
    "training for employees",
    "enterprise AI training",
    "workshop for teams",
  ],
  "can-we-customize-a-program-for-our-team": [
    "custom program for team",
    "tailored corporate training",
    "customize curriculum",
  ],
  "what-time-zones-do-you-support": [
    "time zones",
    "timezone for sessions",
    "IST sessions",
    "can I join from another country",
    "international students",
  ],
  "how-are-the-sessions-conducted": [
    "how sessions work",
    "session format",
    "zoom or google meet",
    "how is class conducted",
    "online or offline",
  ],
  "what-if-i-miss-a-session": [
    "missed a session",
    "if I miss class",
    "recording if I miss",
    "catch up missed session",
  ],
  "who-is-this-for": [
    "who can join",
    "target audience",
    "who should enroll",
    "is this for me",
  ],
  "who-is-this-session-designed-for": [
    "who is free session for",
    "free session audience",
  ],
  "can-i-reschedule-my-session": [
    "reschedule session",
    "change booking time",
    "move my free session",
  ],
  "can-i-reschedule-or-cancel": [
    "cancel free session",
    "reschedule or cancel booking",
    "cancel booking",
  ],
  "how-long-is-the-session": [
    "session length",
    "how long is free session",
    "2 hour session",
    "duration of free session",
  ],
  "what-should-i-prepare-beforehand": [
    "what to prepare",
    "prerequisites free session",
    "do I need laptop",
    "prepare before session",
  ],
  "will-i-receive-resources-afterward": [
    "resources after session",
    "materials after free session",
    "do I get notes",
    "handouts after session",
  ],
  "how-quickly-will-i-get-a-reply": [
    "response time",
    "how fast do you reply",
    "when will you answer email",
    "contact response time",
  ],
  "can-i-book-a-session-directly": [
    "book directly",
    "direct booking",
    "skip contact form book",
  ],
  "is-there-a-physical-office-i-can-visit": [
    "physical office",
    "office location",
    "can I visit in person",
    "offline center",
  ],
  "will-you-try-to-sell-me-a-paid-program": [
    "sales pressure",
    "will you force paid program",
    "hard sell after free",
  ],
  "what-should-i-include-in-my-message": [
    "what to write in contact form",
    "contact form tips",
    "what info to send",
  ],
  "who-is-the-school-students-track-for": [
    "school students track",
    "AI for school students",
    "class 6 to 12 AI course",
    "for school kids",
    "students program who",
  ],
  "who-is-the-college-engineers-track-for": [
    "engineers track",
    "college engineers program",
    "AI for engineers who",
    "engineering students course",
  ],
  "who-is-the-product-managers-track-for": [
    "PM track",
    "product managers program",
    "AI for PMs",
    "product manager course who",
  ],
  "tell-me-about-the-ai-explorers-for-school-students-program": [
    "AI explorers program",
    "school students program details",
    "AI for students course details",
  ],
  "tell-me-about-the-ai-engineering-foundations-program": [
    "AI engineering foundations",
    "engineers program details",
    "engineering track details",
  ],
  "tell-me-about-the-ai-foundations-for-product-managers-progra": [
    "AI foundations for PMs",
    "PM program details",
    "product managers course details",
  ],
  "where-can-i-read-articles-and-guides": [
    "blog",
    "library articles",
    "where is library",
    "read guides",
    "resources and articles",
  ],
  "how-do-i-subscribe-to-the-newsletter": [
    "newsletter subscribe",
    "join newsletter",
    "weekly newsletter signup",
    "email newsletter",
  ],
  "how-do-i-contact-verlin-labs": [
    "contact verlin labs",
    "how to contact you",
    "email address",
    "get in touch",
    "support contact",
  ],
};

const GENERIC_PREFIXES = [
  "can you tell me",
  "please explain",
  "i want to know",
  "quick question",
  "help me understand",
  "could you explain",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripQuestionMark(q: string): string {
  return q.replace(/\?+$/, "").trim();
}

function patternVariations(question: string): string[] {
  const q = stripQuestionMark(question);
  const lower = q.toLowerCase();
  const out: string[] = [];

  out.push(lower);
  out.push(`${lower}?`);
  out.push(lower.replace(/^what is /, "what's "));
  out.push(lower.replace(/^what are /, "what're "));
  out.push(lower.replace(/^how do i /, "how can i "));
  out.push(lower.replace(/^how do i /, "how to "));
  out.push(lower.replace(/^how can i /, "how do i "));
  out.push(lower.replace(/^is this /, "is it "));
  out.push(lower.replace(/^do i /, "do we "));
  out.push(lower.replace(/^will there /, "is there "));
  out.push(lower.replace(/^can i /, "could i "));
  out.push(lower.replace(/^can i /, "can we "));
  out.push(lower.replace(/^who is /, "who are "));
  out.push(lower.replace(/^tell me about /, "explain "));
  out.push(lower.replace(/^tell me about /, "details on "));

  // Imperative / casual
  if (lower.startsWith("what is ")) {
    const rest = lower.slice("what is ".length);
    out.push(`explain ${rest}`);
    out.push(`define ${rest}`);
    out.push(`${rest} meaning`);
    out.push(`about ${rest}`);
  }
  if (lower.startsWith("how do i ") || lower.startsWith("how can i ")) {
    const rest = lower.replace(/^how (do|can) i /, "");
    out.push(`steps to ${rest}`);
    out.push(`guide to ${rest}`);
    out.push(rest);
  }
  if (lower.startsWith("is ") || lower.startsWith("do ") || lower.startsWith("can ")) {
    out.push(lower.replace(/\?$/, "") + " or not");
  }

  for (const prefix of GENERIC_PREFIXES) {
    out.push(`${prefix}: ${lower}`);
    out.push(`${prefix} ${lower}`);
  }

  // India-common informal
  out.push(lower.replace(/programme/g, "program"));
  out.push(`${lower} please`);
  out.push(`sir ${lower}`);
  out.push(`hi ${lower}`);

  return out;
}

/**
 * Build a deduped, labeled set of alternate questions for one training entry.
 */
export function buildAlternateQuestions(seed: VariationSeed, max = 24): string[] {
  const canonical = normalize(seed.question);
  const bag = new Set<string>();

  const add = (raw: string) => {
    const n = normalize(raw);
    if (!n || n === canonical || n.length < 4) return;
    // drop near-duplicates that only differ by punctuation
    const compact = n.replace(/[^a-z0-9]+/g, "");
    if (compact === canonical.replace(/[^a-z0-9]+/g, "")) return;
    bag.add(n);
  };

  for (const a of seed.alternateQuestions ?? []) add(a);
  for (const a of CURATED_ALTERNATES[seed.id] ?? []) add(a);
  for (const a of patternVariations(seed.question)) add(a);

  // Category-aware extras
  const cat = seed.category.toLowerCase();
  if (cat.includes("free") || cat.includes("session")) {
    add("free workshop details");
    add("free intro session info");
  }
  if (cat.includes("pricing") || cat.includes("price")) {
    add("fees structure");
    add("cost in inr");
  }
  if (cat.includes("course") || cat.includes("track")) {
    add("program details");
    add("which course fits me");
  }

  return Array.from(bag).slice(0, max);
}

export function expandEntryKeywords(
  question: string,
  answer: string,
  category: string,
  alternateQuestions: string[],
  existing: string[] = []
): string[] {
  const words = new Set(existing.map((w) => w.toLowerCase()));
  const feed = [question, answer, category, ...alternateQuestions].join(" ");
  for (const w of feed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)) {
    words.add(w);
  }
  return Array.from(words);
}
