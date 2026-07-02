const topics = [
  "Mental Models",
  "AI Fundamentals",
  "Live Workshops",
  "Hands-on Projects",
  "Clarity-First Teaching",
  "LLMs & Transformers",
  "Product Discovery",
  "Vibe Coding",
  "Portfolio Projects",
  "Capstone Demo Day",
  "Free 2-Hour Sessions",
  "Interview Prep",
];

export function TopicMarquee() {
  const doubled = [...topics, ...topics];

  return (
    <div className="overflow-hidden border-b border-border bg-deep-teal py-3">
      <div className="flex animate-marquee-slow gap-8 w-max">
        {doubled.map((topic, i) => (
          <span
            key={`${topic}-${i}`}
            className="shrink-0 text-sm font-medium text-white/90 whitespace-nowrap"
          >
            {topic} <span className="text-accent-teal mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}