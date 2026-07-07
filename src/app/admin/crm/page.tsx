import { CrmDashboard } from "@/components/admin/CrmDashboard";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "CRM",
  description: "Manage leads, subscribers, and people for Verlin Labs.",
  path: "/admin/crm",
});

export default function CrmPage() {
  return <CrmDashboard />;
}