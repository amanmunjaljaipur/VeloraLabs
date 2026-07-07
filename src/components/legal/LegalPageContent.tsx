import { LegalSectionBlock, formatLegalDate } from "@/lib/legal/render";
import { getPublicDocument } from "@/lib/legal/store";
import type { LegalDocType } from "@/lib/legal/types";

export function LegalPageContent({ type }: { type: LegalDocType }) {
  const doc = getPublicDocument(type);

  return (
    <section className="section-y">
      <div className="container-verlin max-w-3xl space-y-10">
        <p className="text-sm text-text-secondary">
          Version {doc.version} · Last updated {formatLegalDate(doc.lastUpdated)}
        </p>
        <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-text-secondary">
          {doc.disclaimer}
        </p>
        {doc.sections.map((section) => (
          <LegalSectionBlock key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}