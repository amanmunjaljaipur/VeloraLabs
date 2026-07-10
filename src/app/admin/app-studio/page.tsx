import { AppStudioWorkspace } from "@/components/app-studio/AppStudioWorkspace";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "App Studio",
  "AI app generator — research workflows, generate React apps, live preview.",
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
          Lovable-style builder: chat on the left, live preview and code on the right. Uses platform
          Grok (or Anthropic if configured).
        </p>
      </div>
      <AppStudioWorkspace />
    </div>
  );
}
