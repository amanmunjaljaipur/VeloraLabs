import { AppBuilderStudio } from "@/components/admin/AppBuilderStudio";
import { noIndexMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = noIndexMetadata(
  "App Builder",
  "Admin App Builder — prompt, interview, LLM, deploy.",
  "/admin/app-builder"
);

export default function AdminAppBuilderPage() {
  return (
    <div>
      <div className="border-b border-border bg-accent-teal/10 px-4 py-3 text-sm text-foreground">
        <strong className="font-semibold">Forge</strong> is the new discovery-first
        builder.{" "}
        <Link
          href="/admin/forge"
          className="font-medium text-accent-teal underline-offset-2 hover:underline"
        >
          Open Forge →
        </Link>
      </div>
      <AppBuilderStudio />
    </div>
  );
}
