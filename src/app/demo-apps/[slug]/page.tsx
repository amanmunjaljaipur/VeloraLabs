import { DemoAuthShell } from "@/components/demo-apps/DemoAuthShell";
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
  return createMetadata({
    title: `${hit.spec.brandName} · Sign in`,
    description: hit.spec.tagline || hit.def.description,
    path: `/demo-apps/${slug}`,
  });
}

/**
 * Each demo slug is an individual product app:
 * - Standalone shell (no Verlin site chrome)
 * - Own signup / login / session (isolated by slug)
 * - App admin can switch all product roles after login
 */
export default async function DemoAppPage({ params }: Props) {
  const { slug } = await params;
  const hit = getDemoSpecBySlug(slug);
  if (!hit) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <DemoAuthShell
        slug={slug}
        spec={hit.spec}
        categoryName={hit.def.name}
      />
    </div>
  );
}
