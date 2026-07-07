"use client";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  align?: "left" | "center";
  compact?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  cta?: { label: string; href: string; variant?: "primary" | "secondary" | "cta" };
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = "",
  align = "left",
  compact,
  breadcrumbs,
  children,
  cta,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/80 bg-hero-mesh",
        compact ? "py-12 md:py-16" : "py-16 md:py-24"
      )}
    >
      <div className="pattern-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-20 top-10 h-56 w-56 opacity-70" aria-hidden="true" />
      <div className="hero-orb hero-orb-amber right-0 top-1/4 h-48 w-48 opacity-60" aria-hidden="true" />

      <div className="container-verlin relative">
        <div
          className={cn(
            "grid gap-10 lg:items-center",
            image ? "lg:grid-cols-2 lg:gap-16" : "max-w-3xl",
            centered && !image && "mx-auto text-center"
          )}
        >
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(centered && !image && "mx-auto")}
          >
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className={cn("mb-4", centered && !image && "flex justify-center")}>
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}
            {eyebrow && <p className="section-eyebrow mb-4">{eyebrow}</p>}
            <h1 className="text-display font-semibold">{title}</h1>
            {subtitle && (
              <p
                className={cn(
                  "mt-6 text-lg leading-relaxed text-text-secondary md:text-xl",
                  centered && "mx-auto max-w-2xl"
                )}
              >
                {subtitle}
              </p>
            )}
            {(cta || children) && (
              <div
                className={cn(
                  "mt-8 flex flex-col gap-3 sm:flex-row",
                  centered && "justify-center"
                )}
              >
                {cta && (
                  <Link href={cta.href}>
                    <Button
                      size="lg"
                      variant={cta.variant ?? "cta"}
                      className={cn("w-full sm:w-auto", cta.variant === "cta" && "shadow-glow-amber")}
                    >
                      {cta.label}
                    </Button>
                  </Link>
                )}
                {children}
              </div>
            )}
          </motion.div>

          {image && (
            <motion.div
              className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl border border-border/80 shadow-lg surface-elevated lg:max-w-none"
              initial={{ x: 16 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <OptimizedImage
                src={image}
                alt={imageAlt}
                fill
                aboveFold
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-navy/30 via-transparent to-accent-teal/15" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}