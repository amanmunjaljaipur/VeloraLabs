import type { AccordionItem } from "@/components/ui/Accordion";

export interface SemanticHub {
  slug: string;
  path: string;
  seoKey: "hubLlmsProductDiscovery" | "hubAiRoadmapPms" | "hubAiSchoolStudents";
  /** Primary question this hub answers (long-tail keyword). */
  targetQuestion: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  sections: { title: string; paragraphs: string[] }[];
  faqs: AccordionItem[];
  courseHref: string;
  landingHref: string;
  libraryLinks: { label: string; href: string }[];
  freeSessionCta: string;
}

export const SEMANTIC_HUBS: SemanticHub[] = [
  {
    slug: "llms-for-product-discovery",
    path: "/learn/llms-for-product-discovery",
    seoKey: "hubLlmsProductDiscovery",
    targetQuestion: "How do product managers use LLMs for product discovery?",
    eyebrow: "PM playbook",
    headline: "How to use LLMs for product discovery - without outsourcing your thinking",
    subheadline:
      "A practical hub for PMs: interview synthesis, theme clustering, assumption stress-tests, and PRD drafting - with clear boundaries on what LLMs can and cannot verify.",
    sections: [
      {
        title: "The PM discovery problem LLMs actually help with",
        paragraphs: [
          "Product discovery produces messy qualitative data - interview notes, support tickets, sales call summaries, and stakeholder opinions. LLMs excel at structuring that mess into themes, follow-up questions, and draft outlines when you provide primary sources and checkpoints.",
          "They do not replace customer contact. The win is speed on synthesis and repetition - not automating judgement about what to build.",
        ],
      },
      {
        title: "A repeatable workflow (mental model first)",
        paragraphs: [
          "Start with the information pipeline mental model: inputs → compression → output. For discovery, inputs are raw notes; compression is clustering and summarisation; output is a testable problem statement and non-goals.",
          "Verlin Labs PMs practice this in live sessions with Claude and NotebookLM - always with source links open and a human checkpoint list before anything reaches a PRD.",
        ],
      },
      {
        title: "When to move from articles to a live program",
        paragraphs: [
          "Self-serve reading gets you literacy. The 16-day PM track adds accountable practice: AI-assisted discovery, PRD structure, vibe-coding MVPs with Replit or Lovable, and capstone demo day with mentor feedback.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can LLMs replace user interviews?",
        answer:
          "No. They help synthesise interviews you already conducted - clustering themes, drafting follow-ups, and spotting gaps. Customer contact stays human-led; LLMs handle structured repetition.",
      },
      {
        question: "Which tools do Verlin Labs PMs use for discovery?",
        answer:
          "Claude and ChatGPT for drafting and synthesis, NotebookLM for source-grounded research, and modern MVP builders for prototyping. Every tool is taught with evaluation criteria - not vendor hype.",
      },
    ],
    courseHref: "/courses/professionals",
    landingHref: "/ai-for-pms",
    libraryLinks: [
      { label: "How to learn AI for product management", href: "/library/how-to-learn-ai-for-product-management" },
      { label: "AI product discovery playbook", href: "/library/ai-product-discovery-playbook" },
      { label: "AI decision frameworks for leaders", href: "/library/ai-for-decision-makers" },
    ],
    freeSessionCta: "Book a free PM session",
  },
  {
    slug: "ai-roadmap-for-non-technical-pms",
    path: "/learn/ai-roadmap-for-non-technical-pms",
    seoKey: "hubAiRoadmapPms",
    targetQuestion: "What is the AI learning roadmap for non-technical product managers?",
    eyebrow: "PM roadmap",
    headline: "AI roadmap for non-technical PMs - literacy, evaluation, then shipping",
    subheadline:
      "You do not need a CS degree. This hub maps what to learn first, what to defer, and how Verlin Labs PMs go from tool demos to shipped MVPs in 16 days.",
    sections: [
      {
        title: "Phase 1 - AI literacy (weeks 1–2)",
        paragraphs: [
          "Learn how LLMs behave: tokens, context limits, hallucinations, and when pattern-matching fluency is not factual accuracy. Mental models turn every vendor announcement into a familiar trade-off.",
        ],
      },
      {
        title: "Phase 2 - Tool evaluation without demo theatre",
        paragraphs: [
          "Build a scorecard: privacy, integration, verifiability, latency, cost at your volume, and failure modes. Ask what happens when retrieval is empty and who owns prompt versioning after model updates.",
        ],
      },
      {
        title: "Phase 3 - Ship an MVP with vibe coding",
        paragraphs: [
          "PMs prototype faster with AI-assisted builders. The skill is constraints: user flow, edge cases, and acceptance criteria - not writing every line of production code.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long does the full PM roadmap take at Verlin Labs?",
        answer:
          "The live program is 16 days with capstone demo day. Many PMs start with the free 2-hour session to experience pacing before enrolling.",
      },
      {
        question: "Do I need Jira or technical tools experience?",
        answer:
          "Familiarity with product workflows helps, but we teach AI-specific evaluation and prototyping - including when to pair with engineering and when to stop at a learning prototype.",
      },
    ],
    courseHref: "/courses/professionals",
    landingHref: "/ai-for-pms",
    libraryLinks: [
      { label: "How to learn AI for product management", href: "/library/how-to-learn-ai-for-product-management" },
      { label: "Build MVP with AI coding tools", href: "/library/build-mvp-with-ai-coding-tools" },
      { label: "Prompt engineering basics", href: "/library/prompt-engineering-basics" },
    ],
    freeSessionCta: "Start with a free PM intro session",
  },
  {
    slug: "ai-for-school-students",
    path: "/learn/ai-for-school-students",
    seoKey: "hubAiSchoolStudents",
    targetQuestion: "How should school students learn AI safely and clearly?",
    eyebrow: "Student roadmap",
    headline: "AI learning roadmap for school students (Classes 6–12)",
    subheadline:
      "Safe AI tool use, mental models before jargon, and a showcase project - how Verlin Labs helps students understand technology they already interact with daily.",
    sections: [
      {
        title: "Start with understanding, not tool tricks",
        paragraphs: [
          "Students meet AI through ChatGPT, recommendation feeds, and homework helpers. The roadmap begins with what prediction means, why fluent answers can be wrong, and how to ask better questions - not prompt hacks.",
        ],
      },
      {
        title: "Age-appropriate practice",
        paragraphs: [
          "Verlin Labs uses plain analogies, visual frameworks, and supervised tool exercises. Parents receive clarity on boundaries; students build a showcase project they can explain in their own words.",
        ],
      },
      {
        title: "From free session to 8-day program",
        paragraphs: [
          "Book the student-track free session first. The full AI Explorers program adds live cohort sessions, mental models, and demo day - designed for Classes 6–12.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is ChatGPT safe for students to use?",
        answer:
          "With guidance. We teach safe use, verification habits, and when to involve a parent or teacher - not unsupervised dependence on fluent answers.",
      },
      {
        question: "Does the student program require coding?",
        answer:
          "No prior coding is required. The focus is mental models, responsible tool use, and a hands-on showcase project appropriate for school ages.",
      },
    ],
    courseHref: "/courses/students",
    landingHref: "/ai-for-students",
    libraryLinks: [
      { label: "ChatGPT explained for students", href: "/library/chatgpt-for-students" },
      { label: "AI ethics for students", href: "/library/ai-ethics-for-students" },
      { label: "How LLMs work", href: "/library/how-llms-work" },
    ],
    freeSessionCta: "Book a free student session",
  },
];

export function getSemanticHub(slug: string): SemanticHub | undefined {
  return SEMANTIC_HUBS.find((hub) => hub.slug === slug);
}

export function getAllSemanticHubSlugs(): string[] {
  return SEMANTIC_HUBS.map((hub) => hub.slug);
}