"use client";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import {
  splitVerlinBrandTitle,
  VerlinBrandText,
} from "@/components/ui/VerlinBrandText";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  /** Optional muted loop - OpenAI-style product media */
  video?: string;
  /**
   * "contain" for custom illustrations with baked-in text/labels near the
   * edges - "cover" (default) crops a 16:9 image inside this 4:3 frame and
   * cuts off headlines. Use "contain" for any generated diagram/illustration.
   */
  imageFit?: "cover" | "contain";
  /** Text alignment inside the copy column only */
  align?: "left" | "center";
  compact?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  cta?: { label: string; href: string; variant?: "primary" | "secondary" | "cta" };
}

/**
 * Side-by-side when media is present. Quiet OpenAI-like craft.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = "",
  video,
  imageFit = "cover",
  align = "left",
  compact,
  breadcrumbs,
  children,
  cta,
}: PageHeaderProps) {
  const reduceMotion = useReducedMotion();
  const textCenter = align === "center";
  const { hasBrand, rest: titleRest } = splitVerlinBrandTitle(title);
  const hasMedia = Boolean(image);

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border bg-[var(--canvas)]",
        compact ? "py-12 md:py-16" : "section-y"
      )}
    >
      <div className="container-verlin relative">
        <div
          className={cn(
            "grid-editorial items-center",
            hasMedia ? "lg:grid-cols-2 lg:gap-14 xl:gap-16" : "max-w-3xl"
          )}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
            className={cn(
              "w-full max-w-xl",
              textCenter ? "text-center" : "text-left",
              !hasMedia && textCenter && "mx-auto"
            )}
          >
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className={cn("mb-4", textCenter && "flex justify-center")}>
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}
            {eyebrow && (
              <p className={cn("section-eyebrow mb-4", textCenter && "mx-auto")}>
                {eyebrow}
              </p>
            )}
            <h1 className="text-display">
              {hasBrand ? (
                <VerlinBrandText
                  tone="default"
                  after={titleRest}
                  afterClassName="text-text-primary"
                />
              ) : (
                title
              )}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  "mt-5 text-base leading-relaxed text-text-secondary md:text-[1.0625rem] md:leading-relaxed",
                  textCenter && "mx-auto max-w-xl"
                )}
              >
                {subtitle}
              </p>
            )}
            {(cta || children) && (
              <div
                className={cn(
                  "mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap",
                  textCenter && "mx-auto sm:justify-center"
                )}
              >
                {cta && (
                  <Link href={cta.href} className="inline-flex w-full min-w-0 sm:w-auto">
                    <Button
                      size="lg"
                      variant={cta.variant ?? "cta"}
                      className="w-full sm:w-auto"
                    >
                      {cta.label}
                    </Button>
                  </Link>
                )}
                {children}
              </div>
            )}
          </motion.div>

          {hasMedia && image && (
            <motion.div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-[var(--bg-light)] shadow-[var(--shadow-sm)]"
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: DURATION.reveal, delay: 0.05, ease: EASE_OUT }}
            >
              <MediaFrame
                image={image}
                alt={imageAlt}
                video={video}
                fit={imageFit}
                priority
                rounded={false}
                scrim="none"
                sharpText
                className={cn("absolute inset-0 min-h-0", imageFit === "contain" && "bg-[#faf9f4]")}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
