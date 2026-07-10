import { DEMO_CATEGORIES, DEMO_GROUP_ORDER } from "@/lib/demo-apps";
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

  // Normal document scroll (not standalone shell) so the catalog is easy to browse
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
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

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 pb-20 md:px-6">
        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-teal">
            Production-style product demos
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Industry-standard navigation, footers, and content — 50 serious apps
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each demo is built like a real product review build: market-standard information
            architecture (bottom tabs, sidebars, hybrid banking patterns), multi-column footers with
            legal/support/compliance, educational outcomes, FAQs, and multi-role workflows. Not a
            joke UI — content and chrome match industry benchmarks (banking, marketplace, edtech,
            health, travel, workplace).
          </p>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>
              <strong>Opens in a new tab</strong> as a full-screen product — no Verlin navbar,
              admin menu, or site footer
            </li>
            <li>Industry nav: top bar or left sidebar + mobile bottom tabs</li>
            <li>Multi-sided roles (customer, ops, compliance, teacher, driver…)</li>
          </ul>
        </section>

        {byGroup.map((group) => (
          <section key={group.id}>
            <h2 className="mb-4 text-lg font-semibold text-foreground">{group.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((c) => (
                <a
                  key={c.slug}
                  href={`/demo-apps/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <Card hover className="h-full p-4 transition hover:border-accent-teal/40">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal">
                        {c.brandName}
                      </p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Opens as app ↗
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-foreground">{c.name}</h3>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{c.tagline}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                    {c.learning?.outcomes?.[0] && (
                      <p className="mt-2 line-clamp-2 text-[11px] text-accent-teal/90">
                        Practice: {c.learning.outcomes[0]}
                      </p>
                    )}
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      {c.roles.length} roles · {c.modules.length} modules ·{" "}
                      {c.workflows.length} workflows
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      Like: {c.examples.slice(0, 3).join(", ")}
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
