import type { AudienceSlug } from "@/lib/content";
import type { AccordionItem } from "@/components/ui/Accordion";

export interface AudienceLandingConfig {
  slug: AudienceSlug;
  path: string;
  seoKey: "aiForStudents" | "aiForPms" | "aiForEngineers";
  eyebrow: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  howToName: string;
  howToDescription: string;
  howToSteps: { name: string; text: string }[];
  faqs: AccordionItem[];
  relatedLinks: { label: string; href: string }[];
}

const STUDENT_FAQS: AccordionItem[] = [
  {
    question: "What age group is AI for Students designed for?",
    answer:
      "Verlin Labs' student track is built for Classes 6–12. Examples, pacing, and tool use are age-appropriate - with plain-language mental models instead of exam-style jargon.",
  },
  {
    question: "Does my child need coding experience?",
    answer:
      "No prior coding is required. We focus on understanding how AI works, using tools safely, and building a showcase project - curiosity matters more than technical background.",
  },
  {
    question: "Can students try before enrolling in the full program?",
    answer:
      "Yes. Start with the free 2-hour session tailored to students. It includes live mental models, a hands-on exercise, and next-step guidance with no payment required.",
  },
];

const PM_FAQS: AccordionItem[] = [
  {
    question: "Do product managers need to code for this program?",
    answer:
      "No PhD and no engineering background required. Verlin Labs teaches PMs to evaluate AI tools, run discovery, draft PRDs, and prototype MVPs with clarity-first frameworks.",
  },
  {
    question: "What will I be able to do after AI for PMs training?",
    answer:
      "Evaluate vendors honestly, lead AI-assisted discovery, ship a capstone MVP, and present trade-offs to stakeholders - with mental models you can reuse on every new tool release.",
  },
  {
    question: "Is there a free way to experience the teaching style?",
    answer:
      "Book the free 2-hour session and select Product Manager as your role. Content adapts to PM workflows - tool evaluation, product thinking, and live Q&A.",
  },
];

const ENGINEER_FAQS: AccordionItem[] = [
  {
    question: "Is this for CS majors only?",
    answer:
      "Built for college engineers and CS students, but non-CS majors who want LLM intuition and portfolio work are welcome. We bridge theory and hands-on practice.",
  },
  {
    question: "What topics does the engineer track cover?",
    answer:
      "LLM fundamentals, transformers as information pipelines, RAG, fine-tuning vs prompting, portfolio projects, and interview prep - taught with mental models, not slide dumps.",
  },
  {
    question: "How do I know if Verlin Labs fits my level?",
    answer:
      "Start with the free session on the engineer track. We assess your goals live and recommend whether the 10-day intensive or self-paced library resources fit best.",
  },
];

export const AUDIENCE_LANDING: Record<string, AudienceLandingConfig> = {
  students: {
    slug: "students",
    path: "/ai-for-students",
    seoKey: "aiForStudents",
    eyebrow: "AI for school students",
    headline: "AI for Students - learn how technology works, not just how to use it",
    subheadline:
      "My own kids are starting to hear about AI everywhere - at school, on their phones, from friends. This 8-day track is what I would want them to sit through: everyday analogies, safe tool practice, and a showcase project they are actually proud to demo, taught live by founder Aman Munjal.",
    benefits: [
      "Everyday analogies - no scary jargon or exam cramming",
      "Safe, age-appropriate AI tool use with clear boundaries",
      "8-day live program with showcase demo day",
      "Free 2-hour session to experience teaching before you enroll",
    ],
    howToName: "How to start learning AI as a school student at Verlin Labs",
    howToDescription:
      "A clarity-first path from free session to full student program - mental models, live sessions, and a showcase project.",
    howToSteps: [
      { name: "Book a free session", text: "Choose the student track and pick a live 2-hour intro slot." },
      { name: "Learn mental models live", text: "See how Verlin Labs explains AI with visual frameworks and Q&A." },
      { name: "Try a hands-on exercise", text: "Apply the framework to a student-friendly problem during the session." },
      { name: "Enroll in the 8-day track", text: "Continue with the full AI Explorers program if it fits your goals." },
    ],
    faqs: STUDENT_FAQS,
    relatedLinks: [
      { label: "Full student course syllabus", href: "/courses/students" },
      { label: "ChatGPT explained for students", href: "/library/chatgpt-for-students" },
      { label: "Mental models hub", href: "/mental-models" },
    ],
  },
  professionals: {
    slug: "professionals",
    path: "/ai-for-pms",
    seoKey: "aiForPms",
    eyebrow: "AI for product managers",
    headline: "AI for Product Managers - evaluate tools, ship MVPs, lead with clarity",
    subheadline:
      "I have sat through enough AI vendor demos to know the theatre from the substance. This program is my attempt to give PMs the same filter - mental models for LLMs, AI-assisted discovery, PRDs, vibe-coding MVPs, and a capstone demo day with real feedback, not applause.",
    benefits: [
      "Evaluate AI vendors without demo-day theatre",
      "AI-assisted discovery, PRDs, and stakeholder-ready narratives",
      "Build and present a capstone MVP - not just slide decks",
      "16-day live cohort with PM-specific examples throughout",
    ],
    howToName: "How product managers learn AI at Verlin Labs",
    howToDescription:
      "From free intro session to capstone demo - a structured PM path for AI literacy and product leadership.",
    howToSteps: [
      { name: "Book a PM free session", text: "Select Product Manager when booking the 2-hour intro." },
      { name: "Build AI literacy", text: "Learn mental models for LLMs, hallucinations, and tool boundaries." },
      { name: "Practice product workflows", text: "Run AI-assisted discovery and structured PRD drafting." },
      { name: "Ship a capstone MVP", text: "Prototype with modern AI builders and present on Demo Day." },
    ],
    faqs: PM_FAQS,
    relatedLinks: [
      { label: "Full PM course syllabus", href: "/courses/professionals" },
      { label: "How to learn AI for product management", href: "/library/how-to-learn-ai-for-product-management" },
      { label: "AI decision frameworks", href: "/library/ai-for-decision-makers" },
    ],
  },
  engineers: {
    slug: "engineers",
    path: "/ai-for-engineers",
    seoKey: "aiForEngineers",
    eyebrow: "AI for college engineers",
    headline: "AI for Engineers - from LLM fundamentals to portfolio-ready projects",
    subheadline:
      "I wish I had had this when I was first trying to make sense of transformers and RAG. This track builds durable intuition, not just tutorial recall - live sessions, mental models, and portfolio work that actually survives an interview.",
    benefits: [
      "Transformers and LLMs explained as information pipelines",
      "Hands-on API projects and portfolio pieces recruiters can evaluate",
      "10-day intensive with responsible AI and system-design thinking",
      "Free session first - experience pacing and depth before enrolling",
    ],
    howToName: "How college engineers learn AI at Verlin Labs",
    howToDescription:
      "A structured engineer path from free session through LLM fundamentals to portfolio and interview prep.",
    howToSteps: [
      { name: "Book an engineer free session", text: "Pick the college engineer track on the free session page." },
      { name: "Map LLM fundamentals", text: "Learn tokens, attention, and prediction with mental models." },
      { name: "Build hands-on projects", text: "Apply concepts through guided API and RAG exercises." },
      { name: "Complete the 10-day track", text: "Finish with portfolio work and interview preparation." },
    ],
    faqs: ENGINEER_FAQS,
    relatedLinks: [
      { label: "Full engineer course syllabus", href: "/courses/engineers" },
      { label: "How to learn AI as an engineering student", href: "/library/how-to-learn-ai-as-an-engineering-student" },
      { label: "Vector search & RAG guide", href: "/library/vector-search-rag-in-practice" },
    ],
  },
};

export function getAudienceLanding(slug: AudienceSlug): AudienceLandingConfig {
  return AUDIENCE_LANDING[slug];
}