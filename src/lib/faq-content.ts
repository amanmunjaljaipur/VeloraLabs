import type { AccordionItem } from "@/components/ui/Accordion";

export interface SiteFaqCategory {
  id: string;
  title: string;
  description: string;
  items: AccordionItem[];
}

export const SITE_FAQ_CATEGORIES: SiteFaqCategory[] = [
  {
    id: "general",
    title: "General",
    description: "What Verlin Labs is and who it is for",
    items: [
      {
        question: "What is Verlin Labs?",
        answer:
          "Verlin Labs is a clarity-first learning platform for AI and technology. We teach through mental models, live sessions, and hands-on practice - helping students, engineers, and product managers understand how modern systems actually work, not just memorize buzzwords.",
      },
      {
        question: 'What does "clarity-first learning" mean?',
        answer:
          "We start with frameworks that make complex ideas feel structured and predictable. Instead of dumping information, we build understanding step by step - so you can explain concepts in your own words and apply them to new situations.",
        bullets: [
          "Visual mental models before jargon",
          "Live explanation and Q&A, not passive video dumps",
          "Audience-tailored examples for your background",
        ],
      },
      {
        question: "Is this suitable for complete beginners?",
        answer:
          "Yes. The free session and student track are designed for first exposure to AI. We use plain language and visual frameworks. Engineers and professionals get more depth, but we never assume you already know the topic.",
      },
    ],
  },
  {
    id: "free-session",
    title: "Free Session",
    description: "Booking, expectations, and what happens next",
    items: [
      {
        question: "Is the 2-hour session really free?",
        answer:
          "Yes - the full introductory session is free. No enrollment fee, no credit card to book, and no hidden charges during or after the session.",
        bullets: [
          "No payment information collected at booking",
          "You are never auto-enrolled in a paid program",
          "Paid enrollment is optional and only discussed if it fits your goals",
        ],
      },
      {
        question: "Will there be any sales pitch during the session?",
        answer:
          "No hard sell. The session is a structured teaching experience - mental models, a live AI walkthrough, a hands-on exercise, and Q&A. We may mention the full program if it is relevant to your goals, but there is no pressure or time-limited tactics.",
      },
      {
        question: "What happens after the free session?",
        answer:
          "You will receive a follow-up email within 1–2 business days with a summary, key frameworks, and suggested next steps for your track.",
        bullets: [
          "Curated starter resource pack",
          "Optional overview of the full Verlin Labs program",
          "No obligation to enroll",
        ],
      },
      {
        question: "How soon can I get a slot?",
        answer:
          "Availability depends on the calendar - weekdays typically have more open times than weekends. Book through the Free Session page and you will see real-time slots. Confirmation is immediate, with a calendar invite by email.",
      },
    ],
  },
  {
    id: "programs",
    title: "Courses & Tracks",
    description: "Tracks, duration, and enrollment",
    items: [
      {
        question: "What is the difference between the three tracks?",
        answer:
          "All tracks share the same clarity-first framework, but examples, pace, and project depth adapt to your background.",
        bullets: [
          "School Students (Classes 6–12) - friendly analogies, safe AI tool use, showcase project (8-day student-friendly program)",
          "College Engineers - LLM fundamentals to portfolio projects and interview prep (10-day intensive)",
          "Product Managers - AI-first PM workflow, discovery, PRDs, MVP build, capstone demo (16-day program)",
        ],
      },
      {
        question: "How long are the programs?",
        answer:
          "The student track runs 8 days, the engineer track 10 days, and the product manager track 16 days. Each includes live sessions, guided exercises, and project work. Exact schedules are shared during enrollment.",
      },
      {
        question: "Do I get a certificate?",
        answer:
          "Completing the full program includes a Verlin Labs completion certificate and capstone presentation. The free introductory session does not include a certificate - it is an experience session to help you decide if the full track fits.",
      },
      {
        question: "Can I switch tracks later?",
        answer:
          "If you realize another track is a better fit, contact us before the program advances too far. We will help you move when pacing and content overlap allow. Starting with the free session is the best way to confirm your track before enrolling.",
      },
    ],
  },
  {
    id: "learning",
    title: "Learning Experience",
    description: "How we teach and what you will use",
    items: [
      {
        question: "How is this different from YouTube or other online courses?",
        answer:
          "Most content optimizes for watch time. Verlin Labs optimizes for understanding - live mental models, mentor Q&A, audience-tailored pacing, and hands-on exercises with feedback. You leave knowing what to do next, not just what to watch next.",
      },
      {
        question: "Do I need any technical background?",
        answer:
          "Not for the free session or student track. Engineer and PM tracks go deeper, but we still build from frameworks first. Bring curiosity; we handle structure and scaffolding.",
      },
      {
        question: "What tools will I use?",
        answer:
          "Tools vary by track - from accessible AI assistants and no-code builders for students and PMs, to coding environments and APIs for engineers. We introduce tools only after the underlying concept is clear, and we never require expensive paid software for the free session.",
      },
      {
        question: "Are the sessions live or recorded?",
        answer:
          "The free session and core program sessions are live and interactive. Enrolled learners in the full program get access to session recordings and structured modules through the My Course dashboard for review.",
      },
    ],
  },
  {
    id: "teams",
    title: "For Teams & Organizations",
    description: "Corporate workshops and custom programs",
    items: [
      {
        question: "Do you offer corporate or team training?",
        answer:
          "Yes. We run clarity-first AI literacy workshops for teams - tailored examples, live Q&A, and follow-up resources. Contact us with your team size, goals, and timeline for options.",
      },
      {
        question: "Can we customize a program for our team?",
        answer:
          "Yes. We can adapt modules, case studies, and pacing for your industry and skill mix. Share your context through the contact form and we will propose a structure that fits.",
      },
    ],
  },
  {
    id: "logistics",
    title: "Technical & Logistics",
    description: "Scheduling, format, and attendance",
    items: [
      {
        question: "What time zones do you support?",
        answer:
          "Sessions are scheduled in India Standard Time (IST) by default, with slots designed for learners in India and compatible regions. If you are in another time zone, mention it when booking or contacting us - we will suggest the best available options.",
      },
      {
        question: "How are the sessions conducted?",
        answer:
          "Online via video conferencing. You will receive a link after booking. A laptop or tablet with stable internet is recommended. Camera and microphone are optional but helpful for interaction.",
      },
      {
        question: "What if I miss a session?",
        answer:
          "For the free session, reschedule via your confirmation email (24 hours' notice when possible). Enrolled program learners can review recordings in My Course and contact support for catch-up guidance on missed live days.",
      },
    ],
  },
];

export function getTotalFaqCount(): number {
  return SITE_FAQ_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
}