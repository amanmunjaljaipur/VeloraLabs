import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "content");

const homeFaqs = [
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

const homeContent = {
  hero: {
    headline: "Verlin Labs — clarity-first learning for the AI age",
    subheadline:
      "Verlin Labs helps you master the frameworks that matter in our rapidly changing world. Free 2-hour session and hands-on programs for students, engineers, and PMs.",
    illustration: "/images/hero-home-visual.jpg",
    illustrationAlt:
      "Verlin Labs AI training hero — neural network visualization for clarity-first learning",
  },
  whatWeCover: [
    "Mental Models",
    "AI Fundamentals",
    "Live Workshops",
    "Hands-on Projects",
    "LLMs & Transformers",
    "Product Discovery",
  ],
  howItWorks: [
    { step: 1, title: "Discover", description: "Join a free session and explore.", icon: "calendar" },
    { step: 2, title: "Understand", description: "Learn mental models and core concepts.", icon: "brain" },
    { step: 3, title: "Build", description: "Create real AI projects hands-on from day one.", icon: "wrench" },
    { step: 4, title: "Showcase", description: "Present your project on Demo Day.", icon: "rocket" },
  ],
  howItWorksIllustration: {
    src: "/images/how-it-works-timeline.jpg",
    alt: "How it works — Discover, Understand, Build, and Showcase your AI learning journey from free session to Demo Day",
  },
  learningIllustrations: {
    mentalModels: {
      src: "/images/mental-models-map-illustration.jpg",
      alt: "Mental models infographic — turn complexity into clarity from information to understanding",
    },
    handsOn: {
      src: "/images/hands-on-mvp-illustration.jpg",
      alt: "Instructor leading a hands-on workshop with students around a laptop — practical tech learning from day one",
    },
  },
  homeFaqs,
  testimonialAvatars: {
    "Priya Sharma": "/images/avatar-priya-sharma.jpg",
    "Arjun Mehta": "/images/avatar-arjun-mehta.jpg",
    "Sarah Chen": "/images/avatar-sarah-chen.jpg",
    "Rajesh Kumar": "/images/avatar-rajesh-kumar.jpg",
    "David Okonkwo": "/images/avatar-david-okonkwo.jpg",
    "Maria Gonzalez": "/images/avatar-maria-gonzalez.jpg",
  },
  freeSessionIllustration: {
    src: "/images/free-session-live-illustration.jpg",
    alt: "Live online session with instructor teaching and engaged students",
  },
};

if (!fs.existsSync(path.join(root, "home-content.json"))) {
  fs.writeFileSync(path.join(root, "home-content.json"), JSON.stringify(homeContent, null, 2) + "\n");
}

if (!fs.existsSync(path.join(root, "faq-content.json"))) {
  const faqSource = fs.readFileSync(path.join(root, "..", "src", "lib", "faq-content.ts"), "utf8");
  const categories = [];
  const categoryRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  let match;
  while ((match = categoryRegex.exec(faqSource)) !== null) {
    const itemsBlock = match[4];
    const items = [];
    const itemRegex = /question:\s*"((?:\\.|[^"\\])*)",\s*answer:\s*"((?:\\.|[^"\\])*)"(?:,\s*bullets:\s*\[([\s\S]*?)\])?/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(itemsBlock)) !== null) {
      const item = {
        question: itemMatch[1].replace(/\\"/g, '"'),
        answer: itemMatch[2].replace(/\\"/g, '"'),
      };
      if (itemMatch[3]) {
        const bullets = [...itemMatch[3].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((b) =>
          b[1].replace(/\\"/g, '"')
        );
        if (bullets.length) item.bullets = bullets;
      }
      items.push(item);
    }
    categories.push({
      id: match[1],
      title: match[2],
      description: match[3],
      items,
    });
  }
  fs.writeFileSync(
    path.join(root, "faq-content.json"),
    JSON.stringify({ categories }, null, 2) + "\n"
  );
}

console.log("CMS seed files ready.");