import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { staticPageMetadata } from "@/lib/page-metadata";
import { getAllCourseTracks, getResourceDownloadsIndex } from "@/lib/content";
import { getIntroPricing } from "@/lib/pricing";
import { BRAND_MEDIA } from "@/lib/brand-media";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ArrowRight, Briefcase, Check, Code, GraduationCap, Layers } from "lucide-react";
import Link from "next/link";

export const metadata = staticPageMetadata("products", "/products");

const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Products" }];

interface Bundle {
  slug: string;
  icon: typeof GraduationCap;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  includes: string[];
  price: string;
  originalPrice?: string;
  href: string;
  ctaLabel: string;
}

export default function ProductsPage() {
  const tracks = getAllCourseTracks();
  const studentTrack = tracks.find((t) => t.slug === "students")!;
  const engineerTrack = tracks.find((t) => t.slug === "engineers")!;
  const professionalTrack = tracks.find((t) => t.slug === "professionals")!;
  const resources = getResourceDownloadsIndex();

  const studentPricing = getIntroPricing(studentTrack.course.price);
  const engineerPricing = getIntroPricing(engineerTrack.course.price);
  const professionalPricing = getIntroPricing(professionalTrack.course.price);

  const bundles: Bundle[] = [
    {
      slug: "student-bundle",
      icon: GraduationCap,
      eyebrow: "Student bundle",
      title: "AI Explorers Starter Pack",
      description:
        "Everything a school student (Classes 6-12) needs to start using AI safely and confidently - the free session plus the full 8-day program.",
      image: "/images/audience-students-illustration.jpg",
      imageAlt: "School student AI bundle illustration",
      includes: [
        "Free 2-hour intro session",
        `${studentTrack.course.duration} live program`,
        "Safe, supervised AI tool use",
        "Hands-on mini projects + showcase",
      ],
      price: studentPricing.current,
      originalPrice: studentPricing.original,
      href: "/courses/students",
      ctaLabel: "View student bundle",
    },
    {
      slug: "engineer-toolkit",
      icon: Code,
      eyebrow: "Engineer toolkit",
      title: "AI Engineering Toolkit",
      description:
        "Practical AI-engineering literacy for college engineers - RAG, embeddings, evals, and tool use, built around real portfolio projects.",
      image: "/images/audience-engineers-illustration.jpg",
      imageAlt: "College engineer AI toolkit illustration",
      includes: [
        `${engineerTrack.course.duration} live program`,
        "RAG architecture + embeddings",
        "Evals and prompt design for code",
        "Portfolio-ready capstone project",
      ],
      price: engineerPricing.current,
      originalPrice: engineerPricing.original,
      href: "/courses/engineers",
      ctaLabel: "View engineer toolkit",
    },
    {
      slug: "pm-toolkit",
      icon: Briefcase,
      eyebrow: "PM toolkit",
      title: "AI Product Manager Toolkit",
      description:
        "From AI literacy to shipping your own MVP - discovery, PRDs, vendor evaluation, and a demo-day capstone for product managers.",
      image: "/images/audience-professionals-illustration.jpg",
      imageAlt: "Product manager AI toolkit illustration",
      includes: [
        `${professionalTrack.course.duration} live program`,
        "AI-powered discovery + PRDs",
        "Vendor evaluation frameworks",
        "Ship your own AI-powered MVP",
      ],
      price: professionalPricing.current,
      originalPrice: professionalPricing.original,
      href: "/courses/professionals",
      ctaLabel: "View PM toolkit",
    },
    {
      slug: "corporate-literacy",
      icon: Layers,
      eyebrow: "Team bundle",
      title: "Corporate AI Literacy Program",
      description:
        "Tailored AI literacy workshops for teams - responsible AI frameworks, hands-on exercises, and manager follow-up resources.",
      image: BRAND_MEDIA.courses.image,
      imageAlt: "Corporate team AI literacy workshop illustration",
      includes: [
        "Curriculum tailored to your tools",
        "On-site or remote delivery",
        "Dedicated success manager",
        "Volume pricing for teams",
      ],
      price: "Custom",
      href: "/corporate",
      ctaLabel: "Talk to sales",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/products" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Products"
        title="Packaged offerings, built on mental models"
        subtitle="Every bundle below is the same clarity-first curriculum, packaged for where you are - school, college, work, or your whole team."
        compact
      />

      <section className="section-y pt-0">
        <div className="container-verlin">
          <div className="grid gap-6 md:grid-cols-2">
            {bundles.map((bundle) => {
              const Icon = bundle.icon;
              return (
                <Card
                  key={bundle.slug}
                  id={bundle.slug}
                  hover
                  variant="glass"
                  className="flex h-full flex-col overflow-hidden p-0 scroll-mt-24"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-accent-teal/5 via-background to-bg-light/40">
                    <OptimizedImage
                      src={bundle.image}
                      alt={bundle.imageAlt}
                      fill
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-card/90 text-accent-teal shadow-sm backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-teal">
                      {bundle.eyebrow}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{bundle.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                      {bundle.description}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {bundle.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                      <div>
                        <span className="text-2xl font-bold tabular-nums tracking-tight text-teal">
                          {bundle.price}
                        </span>
                        {bundle.originalPrice && (
                          <span className="ml-2 text-sm font-medium text-text-muted line-through decoration-2">
                            {bundle.originalPrice}
                          </span>
                        )}
                      </div>
                      <ButtonLink href={bundle.href} size="sm" variant="cta">
                        {bundle.ctaLabel}
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {resources.length > 0 && (
        <section className="section-y bg-muted/30">
          <div className="container-verlin">
            <SectionHeader
              eyebrow="Also included"
              title="Free downloadable resources"
              subtitle="Worksheets, cheat sheets, and glossaries that pair with every bundle above - free, no enrollment required."
              className="mb-8"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.slice(0, 6).map((resource) => (
                <Link key={resource.slug} href={`/resources/${resource.slug}`} className="group block">
                  <Card hover className="flex h-full flex-col p-5">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-teal">
                      {resource.title}
                    </h3>
                    {resource.subtitle && (
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-text-secondary">
                        {resource.subtitle}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-teal">
                      {resource.downloadLabel ?? "Download"}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/resources" className="text-sm font-medium text-teal hover:underline">
                Browse all resources →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section-y">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="See full pricing"
            title="Compare every plan side by side"
            subtitle="Free trial, per-track pricing, and enterprise plans - all on one page."
            className="mb-8"
          />
          <div className="text-center">
            <ButtonLink href="/pricing" size="lg" variant="cta" className="shadow-glow-amber">
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteExploreLinks section="programs" title="Explore programs" limit={4} />
    </>
  );
}
