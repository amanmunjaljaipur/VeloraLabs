import { LegalPageContent } from "@/components/legal/LegalPageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatLegalDate } from "@/lib/legal/render";
import { getPublicDocument } from "@/lib/legal/store";
import { staticPageMetadata } from "@/lib/page-metadata";

export const metadata = staticPageMetadata("refundPolicy", "/refund-policy");

export default function RefundPolicyPage() {
  const doc = getPublicDocument("refund");

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={doc.title}
        subtitle={`Last updated: ${formatLegalDate(doc.lastUpdated)}`}
      />
      <LegalPageContent type="refund" />
    </>
  );
}