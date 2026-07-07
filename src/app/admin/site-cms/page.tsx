import { SiteCmsHub } from "@/components/admin/SiteCmsHub";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Site CMS",
  description: "Manage all Verlin Labs website content page by page.",
  path: "/admin/site-cms",
});

export default function SiteCmsPage() {
  return <SiteCmsHub />;
}