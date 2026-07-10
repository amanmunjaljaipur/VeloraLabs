import { StudioWorkingApp } from "@/components/app-studio/StudioWorkingApp";
import { getDemoSpecBySlug, DEMO_CATEGORIES } from "@/lib/demo-apps/build-demo-spec";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DEMO_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const hit = getDemoSpecBySlug(slug);
  if (!hit) return { title: "App not found" };
  // Product-only title — no Verlin Labs framing in the tab
  return createMetadata({
    title: hit.spec.brandName,
    description: hit.spec.tagline || hit.def.description,
    path: `/demo-apps/${slug}`,
  });
}

/**
 * Pure product surface. Root layout is standalone (middleware x-vl-app-shell)
 * so Verlin navbar, footer, admin chrome, and chatbot never mount.
 */
export default async function DemoAppPage({ params }: Props) {
  const { slug } = await params;
  const hit = getDemoSpecBySlug(slug);
  if (!hit) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <StudioWorkingApp
        spec={hit.spec}
        fullScreen
        className="h-full min-h-0 flex-1 overflow-hidden"
      />
    </div>
  );
}
