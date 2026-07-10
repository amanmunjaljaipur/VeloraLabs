import { AppBuilderV2Workspace } from "@/components/app-builder/AppBuilderV2Workspace";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "App Builder V2 — One Prompt, Real Product",
  "Describe anything you want to build. We research the market and competitors, draft an editable plan, then build the complete, working product with Verlin Labs' own UI.",
  "/admin/app-builder-v2"
);

export default function AdminAppBuilderV2Page() {
  return <AppBuilderV2Workspace />;
}
