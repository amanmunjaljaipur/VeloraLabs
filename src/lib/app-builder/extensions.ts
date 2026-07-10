import type {
  AppExtensionId,
  AppIdeaExample,
  InterviewQuestion,
} from "@/lib/app-builder/types";
import { verticalCoreQuestions } from "@/lib/app-builder/vertical-interview-cores";

export interface AppExtensionMeta {
  id: AppExtensionId;
  label: string;
  plainLabel: string;
  description: string;
  pathPrefix: string;
  /** Soft starter questions — interview AI replaces with prompt-specific ones */
  questions: InterviewQuestion[];
}

/** Starter ideas — shops AND non-ecom products */
export const APP_IDEA_EXAMPLES: AppIdeaExample[] = [
  {
    id: "crafts",
    title: "Handmade crafts shop",
    description: "Catalogue + WhatsApp order",
    emoji: "🏺",
    prompt:
      "I want a simple online shop for my local handmade crafts so neighbours can see products and message me to buy.",
  },
  {
    id: "kirana",
    title: "Neighbourhood grocery",
    description: "Prices and WhatsApp order",
    emoji: "🛒",
    prompt:
      "I run a small neighbourhood grocery and want a simple online catalogue so people nearby can see prices and order on WhatsApp.",
  },
  {
    id: "booking",
    title: "Salon / clinic booking",
    description: "Services, slots, contact",
    emoji: "📅",
    prompt:
      "I run a local salon and want a simple website where people can see services and book appointments by messaging me.",
  },
  {
    id: "tuition",
    title: "Tuition / coaching",
    description: "Batches, fees, enquiry",
    emoji: "📚",
    prompt:
      "I run a tuition centre and want a site for parents to see subjects, batch timings, fees and send an enquiry.",
  },
  {
    id: "resume",
    title: "Resume updater",
    description: "Career tool for job seekers",
    emoji: "📄",
    prompt:
      "I want an app that helps people update their resume and LinkedIn with AI suggestions, tips, and a clean portfolio page.",
  },
  {
    id: "banking",
    title: "Digital banking demo",
    description: "Fintech / wallet product site",
    emoji: "🏦",
    prompt:
      "I want a digital banking product website: savings, UPI wallet, cards, security trust, and a clear apply / get started flow for India users.",
  },
  {
    id: "insurance",
    title: "Insurance product",
    description: "Plans, claims, trust",
    emoji: "🛡️",
    prompt:
      "I want an insurance app site that explains health and term plans simply, shows benefits, FAQ on claims, and a contact / get quote form.",
  },
  {
    id: "portfolio",
    title: "Portfolio site",
    description: "Designer / freelancer",
    emoji: "🎨",
    prompt:
      "I am a freelance designer and want a portfolio website with projects, about me, and contact so clients can hire me.",
  },
  {
    id: "custom",
    title: "Anything else",
    description: "Describe your product in your own words — we shape the app from that",
    emoji: "✨",
    prompt: "",
  },
];

/** Soft starters — vertical-specific chips (never one shop list for every product) */
function extensionSoftQuestions(extensionId: string): InterviewQuestion[] {
  const map: Record<string, ReturnType<typeof verticalCoreQuestions>> = {
    "ecom-local-shop": verticalCoreQuestions("ecom"),
    "digital-banking": verticalCoreQuestions("digital-banking"),
    insurance: verticalCoreQuestions("insurance"),
    "resume-career": verticalCoreQuestions("resume-career"),
    "booking-local": verticalCoreQuestions("booking"),
    "tuition-centre": verticalCoreQuestions("tuition"),
    portfolio: verticalCoreQuestions("portfolio"),
    "generic-app": verticalCoreQuestions("generic"),
  };
  return map[extensionId] || verticalCoreQuestions("generic");
}

export const APP_EXTENSIONS: AppExtensionMeta[] = [
  {
    id: "generic-app",
    label: "Any product (from your idea)",
    plainLabel: "We read your idea and shape the right app — not only shops",
    description:
      "Banking, insurance, resume tools, portals, or anything you describe. Questions adapt to your prompt; every question is skippable.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("generic-app"),
  },
  {
    id: "ecom-local-shop",
    label: "Local shop / catalogue",
    plainLabel: "Products, prices, WhatsApp order",
    description: "Best when you sell physical or digital products with a catalogue.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("ecom-local-shop"),
  },
  {
    id: "booking-local",
    label: "Booking / appointments",
    plainLabel: "Services and simple booking",
    description: "Salon, clinic, consultancy — services and contact to book.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("booking-local"),
  },
  {
    id: "digital-banking",
    label: "Digital banking / fintech",
    plainLabel: "Wallet, savings, trust pages",
    description: "Product marketing site for a bank / neobank style offering.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("digital-banking"),
  },
  {
    id: "insurance",
    label: "Insurance",
    plainLabel: "Plans, benefits, claims FAQ",
    description: "Explain plans simply and collect quote / contact leads.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("insurance"),
  },
  {
    id: "resume-career",
    label: "Resume / career",
    plainLabel: "Resume help and career tools",
    description: "Job-seeker tools, tips, and a clear call to action.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("resume-career"),
  },
  {
    id: "portfolio",
    label: "Portfolio",
    plainLabel: "Work showcase",
    description: "Projects, about, contact for freelancers and creators.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("portfolio"),
  },
  {
    id: "tuition-centre",
    label: "Tuition / coaching",
    plainLabel: "Batches, fees, enquiry",
    description: "Education centre site for parents and students.",
    pathPrefix: "/apps",
    questions: extensionSoftQuestions("tuition-centre"),
  },
];

export function getExtension(id: string): AppExtensionMeta | undefined {
  return APP_EXTENSIONS.find((e) => e.id === id);
}

export function slugifyAppName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "my-app"
  );
}
