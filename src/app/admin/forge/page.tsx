import { ForgeWorkspace } from "@/components/forge/ForgeWorkspace";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "Forge — AI Product Builder",
  "Describe a product, discover requirements, edit the plan, then build.",
  "/admin/forge"
);

export default function AdminForgePage() {
  return <ForgeWorkspace />;
}
