import { AppBuilderStudio } from "@/components/admin/AppBuilderStudio";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "App Builder",
  "Admin App Builder — prompt, interview, LLM, deploy.",
  "/admin/app-builder"
);

export default function AdminAppBuilderPage() {
  return <AppBuilderStudio />;
}
