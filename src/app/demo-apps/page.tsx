import { DEMO_CATEGORIES, DEMO_GROUP_ORDER } from "@/lib/demo-apps/categories";
import { createMetadata } from "@/lib/seo";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Rocket } from "lucide-react";

export const metadata = createMetadata({
  title: "50 Demo Apps",
  description:
    "Interactive multi-role product demos across 50 app categories — Verlin Labs theme.",
  path: "/demo-apps",
});

export default function DemoAppsIndexPage() {
  const byGroup = DEMO_GROUP_ORDER.map((g) => ({
    id: g,
    label: DEMO_CATEGORIES.find((c) => c.group === g)?.groupLabel || g,
    items: DEMO_CATEGORIES.filter((c) => c.group === g),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white dark:bg-accent-teal dark:text-navy">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">50 Demo Apps</h1>
              <p className="text-xs text-muted-foreground">
                {DEMO_CATEGORIES.length} categories · multi-role · Verlin Labs UI
              </p>
            </div>
          </div>
          <Link
            href="/admin/app-studio"
            className="text-sm font-medium text-accent-teal hover:underline"
          >
            Open App Studio →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Each card opens a full interactive product demo: roles (top-right selector), modules,
          create/list/board workflows, validation, and mock API happy/fail paths. Banking and career
          verticals use specialized runtimes; all others use the multi-module Verlin runtime.
        </p>

        {byGroup.map((group) => (
          <section key={group.id}>
            <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((c) => (
                <Link key={c.slug} href={`/demo-apps/${c.slug}`}>
                  <Card hover className="h-full p-4 transition hover:border-accent-teal/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                      {c.brandName}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      {c.roles.length} roles · {c.modules.length} modules ·{" "}
                      {c.workflows.length} workflows
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      Like: {c.examples.slice(0, 3).join(", ")}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
