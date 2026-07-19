import { AppStudioWorkspace } from "@/components/app-studio/AppStudioWorkspace";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "App Studio",
  "AI app generator - research workflows, generate React apps, live preview.",
  "/admin/app-studio"
);

export default function AdminAppStudioPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          App Studio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Research workflows first, build with Verlin Labs UI components, then Publish to a live
          share link at /apps/…
        </p>
      </div>
      <AppStudioWorkspace />
    </div>
  );
}
