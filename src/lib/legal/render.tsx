import type { LegalSection } from "./types";

export function formatLegalDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function LegalSectionBlock({ section }: { section: LegalSection }) {
  const paragraphs = section.content.split(/\n\n+/).filter(Boolean);
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
      <div className="space-y-3 text-text-secondary leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}