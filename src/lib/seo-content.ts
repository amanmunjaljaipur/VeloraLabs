export interface SeoRichLink {
  href: string;
  label: string;
}

export interface SeoRichBlock {
  title: string;
  paragraphs: string[];
  links?: SeoRichLink[];
}

export const HOME_SEO_BLOCK: SeoRichBlock = {
  title: "AI training in India - live sessions, mental models, and hands-on programs",
  paragraphs: [
    "Verlin Labs is a clarity-first AI education platform based in India, built for school students (Classes 6–12), college engineers, and product managers who want to understand artificial intelligence - not just use tools blindly. We teach through live mental models, structured frameworks, and practical exercises so learners can reason about LLMs, transformers, RAG, agents, and product decisions with confidence.",
    "Start with a free 2-hour AI intro session - no credit card required - then explore paid tracks: an 8-day program for students, a 10-day engineering track with portfolio projects and interview prep, and a 16-day product management program with capstone demo day. Every path includes mentor Q&A, downloadable resources, and frameworks you can reuse at school, work, or in interviews.",
    "Beyond programs, Verlin Labs publishes free mental model guides, long-form library articles, downloadable toolkits, a weekly AI newsletter, and corporate AI literacy workshops for teams across India. Whether you are a parent researching safe AI learning for your child, a CS student building an LLM project, or a PM evaluating vendors, our content is designed to be searchable, practical, and honest about limitations.",
  ],
  links: [
    { href: "/free-session", label: "Book free AI session" },
    { href: "/programs", label: "View all AI programs" },
    { href: "/mental-models", label: "Browse mental models" },
    { href: "/library", label: "Read the AI library" },
    { href: "/corporate", label: "Corporate workshops" },
    { href: "/faq", label: "AI training FAQ" },
  ],
};

export const PROGRAMS_SEO_BLOCK: SeoRichBlock = {
  title: "Compare Verlin Labs AI programs for every learner stage",
  paragraphs: [
    "Verlin Labs runs live AI programs in India for three audiences: school students building intuition with age-appropriate depth, college engineers learning LLM fundamentals and shipping portfolio projects, and product managers who need to evaluate tools, run discovery, and ship AI-assisted MVPs without a CS degree.",
    "Each track follows the same clarity-first method - Discover with a free session, Understand through mental models, Build with hands-on exercises, and Showcase on demo day. Programs cover prompt engineering, responsible AI use, transformers and LLMs, RAG basics, product discovery workflows, and real tools such as ChatGPT, Claude, Lovable, and Replit.",
    "Corporate teams can book tailored AI literacy workshops alongside individual enrollments. Browse course syllabi, pricing in INR, session formats, and enrollment steps before you commit.",
  ],
  links: [
    { href: "/courses/students", label: "AI course for students" },
    { href: "/courses/engineers", label: "AI course for engineers" },
    { href: "/courses/professionals", label: "AI course for product managers" },
    { href: "/ai-for-students", label: "AI for school students hub" },
    { href: "/ai-for-engineers", label: "AI for engineers hub" },
    { href: "/ai-for-pms", label: "AI for PMs hub" },
  ],
};

export const MENTAL_MODELS_SEO_BLOCK: SeoRichBlock = {
  title: "Free AI mental models - frameworks for LLMs, transformers, and complex tech",
  paragraphs: [
    "Mental models are reusable frameworks that turn overwhelming AI topics into structured understanding. Verlin Labs publishes free, in-depth guides covering how large language models work, transformer pipelines, attention mechanisms, embeddings, RAG architectures, evaluation habits, and product decision-making with AI tools.",
    "Each guide includes an overview, key principles, step-by-step application, real-world examples, common mistakes, and a concise takeaway - written for students, engineers, and PMs who prefer clarity over jargon. Use these articles to prepare for our live programs, interview discussions, or internal team enablement.",
    "New models are added as the field evolves. Bookmark this hub or subscribe to our newsletter for weekly mental model updates relevant to learners in India and globally.",
  ],
  links: [
    { href: "/library", label: "AI learning library" },
    { href: "/resources", label: "Free downloads & toolkits" },
    { href: "/free-session", label: "Experience models live" },
  ],
};

export const LIBRARY_SEO_BLOCK: SeoRichBlock = {
  title: "AI learning library - long-form guides for students, engineers, and PMs",
  paragraphs: [
    "The Verlin Labs library is a searchable collection of clarity-first AI articles, workshops, and explainers. Topics include how to learn AI for product management, LLM fundamentals for engineers, safe AI tool use for school students, RAG and retrieval patterns, prompt design, career roadmaps, and practical workflows you can apply the same week you read them.",
    "Filter by audience (students, engineers, product managers), difficulty level, and format. Every article is written to stand alone - useful for Google search, classroom prep, interview study, or team reading groups - and links to related mental models, programs, and free session booking when you want live depth.",
    "We update guides as models, tools, and best practices change. Check back often or join the newsletter for new library releases and weekly AI roundups.",
  ],
  links: [
    { href: "/mental-models", label: "Mental models hub" },
    { href: "/blog", label: "AI blog" },
    { href: "/newsletter", label: "Weekly newsletter" },
  ],
};

export const CORPORATE_SEO_BLOCK: SeoRichBlock = {
  title: "Corporate AI literacy workshops for teams in India",
  paragraphs: [
    "Verlin Labs delivers corporate AI training for cross-functional teams, engineering cohorts, and leadership groups across India. Workshops focus on shared vocabulary, responsible AI frameworks, hands-on exercises with tools your organization already uses, and practical methods for evaluating build-vs-buy decisions - without buzzword bingo or vendor pitches.",
    "Choose a half-day literacy workshop for 8–30 people, or multi-session enablement over two to four weeks with manager briefings and capstone-style exercises paced around your sprint calendar. Sessions can cover LLM basics, agent workflows, product discovery with AI, risk review habits, and change management for rolling out new tools.",
    "Contact us with your team size, goals, and timeline. We reply within 24–48 hours on weekdays with format recommendations and next steps.",
  ],
  links: [
    { href: "/contact", label: "Request corporate workshop" },
    { href: "/programs", label: "Individual programs" },
    { href: "/testimonials", label: "Learner reviews" },
  ],
};

export const CONTACT_SEO_BLOCK: SeoRichBlock = {
  title: "Contact Verlin Labs - bookings, enrollments, and corporate inquiries",
  paragraphs: [
    "Reach Verlin Labs for free AI session bookings, paid program enrollment questions, corporate workshop quotes, press inquiries, and partnership discussions. We are based in India and serve learners nationwide through live online sessions in India Standard Time (IST), with options for compatible regions when you mention your time zone at booking.",
    "Email contact@verlinlabs.com or use the form on this page. We typically respond within 24–48 hours on weekdays. For session changes, use the reschedule link in your confirmation email up to 24 hours before your slot.",
  ],
  links: [
    { href: "/free-session", label: "Book free session" },
    { href: "/faq", label: "Read FAQ first" },
    { href: "/corporate", label: "Corporate workshops" },
  ],
};