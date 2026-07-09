import { AppBuilderVision } from "@/components/admin/AppBuilderVision";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "App Builder Lab",
  "Admin-only product vision for App Builder Lab.",
  "/admin/app-builder"
);

export default function AdminAppBuilderPage() {
  return <AppBuilderVision />;
}
