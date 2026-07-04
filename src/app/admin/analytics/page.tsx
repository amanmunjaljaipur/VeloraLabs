import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Analytics",
  description: "Site activity and engagement analytics for Verlin Labs admins.",
  path: "/admin/analytics",
});

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}