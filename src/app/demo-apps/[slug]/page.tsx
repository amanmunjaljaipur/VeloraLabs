import { StudioWorkingApp } from "@/components/app-studio/StudioWorkingApp";
import { getDemoSpecBySlug, DEMO_CATEGORIES } from "@/lib/demo-apps/build-demo-spec";
import { createMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DEMO_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const hit = getDemoSpecBySlug(slug);
  if (!hit) return { title: "Demo not found" };
  return createMetadata({
    title: `${hit.spec.brandName} · ${hit.def.name}`,
    description: hit.def.description,
    path: `/demo-apps/${slug}`,
  });
}

export default async function DemoAppPage({ params }: Props) {
  const { slug } = await params;
  const hit = getDemoSpecBySlug(slug);
  if (!hit) notFound();

  // Fill standalone layout (h-dvh overflow-hidden); product <main> is the scroll surface.
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-navy px-3 py-2 text-white">
        <Link
          href="/demo-apps"
          className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> All 50 demos
        </Link>
        <p className="truncate text-sm font-semibold">
          {hit.spec.brandName} · {hit.def.name}
        </p>
        <span className="hidden max-w-[14rem] truncate text-xs text-white/70 sm:inline">
          {hit.def.learning?.outcomes?.[0] || "Switch roles top-right"}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StudioWorkingApp
          spec={hit.spec}
          fullScreen
          className="h-full min-h-0 flex-1 overflow-hidden"
        />
      </div>
    </div>
  );
}
