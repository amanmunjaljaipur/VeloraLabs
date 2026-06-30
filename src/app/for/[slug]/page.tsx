import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAudience, getAudiences } from "@/lib/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAudiences().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) return { title: "Not Found" };
  return { title: audience.title, description: audience.heroSubtitle };
}

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) notFound();

  return (
    <>
      <PageHeader title={audience.heroTitle} subtitle={audience.heroSubtitle}>
        <Link href={`/free-session?audience=${audience.slug}`}>
          <Button size="lg">Book Free 2-Hour Session</Button>
        </Link>
      </PageHeader>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8">What you&apos;ll gain</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {audience.benefits.map((b) => (
              <Card key={b} hover>
                <p className="text-foreground">{b}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8">
            {audience.tone === "friendly" ? "Fun examples you'll explore" : "Topics you'll explore"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {audience.examples.map((ex) => (
              <Card key={ex}>
                <p className="text-text-secondary leading-relaxed">{ex}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
          <p className="text-text-secondary mb-8">
            Book your free session and experience clarity-first learning tailored for {audience.shortTitle.toLowerCase()}.
          </p>
          <Link href={`/free-session?audience=${audience.slug}`}>
            <Button size="lg">Book Free Session</Button>
          </Link>
        </div>
      </section>
    </>
  );
}