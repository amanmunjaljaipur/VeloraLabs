"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatContentStamp } from "@/lib/utils";
import { Clock } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";

interface ContentCardProps {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  type: string;
  image: string;
  publishedAt?: string;
  updatedAt?: string;
  /** Default library; use /blog for blog index cards */
  hrefBase?: "/library" | "/blog";
}

export function ContentCard({
  slug,
  title,
  description,
  duration,
  level,
  type,
  image,
  publishedAt,
  updatedAt,
  hrefBase = "/library",
}: ContentCardProps) {
  const isIllustration = image.includes("thumb-") || image.includes("-illustration");
  const stamp = updatedAt ?? publishedAt;

  return (
    <Link href={`${hrefBase}/${slug}`} className="group block h-full">
      <Card hover className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative h-44 overflow-hidden rounded-t-xl bg-[var(--bg-light)]">
          <OptimizedImage
            src={image}
            alt={`${title} — Verlin Labs ${type.toLowerCase()} cover image`}
            fill
            className={`transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
              isIllustration ? "object-contain p-4" : "object-cover"
            }`}
            sizes="(max-width: 640px) 100vw, 300px"
          />
        </div>
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="difficulty">{level}</Badge>
            <Badge>{type}</Badge>
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-foreground group-hover:text-teal">
            {title}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary line-clamp-3">
            {description}
          </p>
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {duration}
              </span>
              {stamp && (
                <>
                  <span className="text-text-muted/50" aria-hidden="true">
                    ·
                  </span>
                  <span title={updatedAt ? "Last updated" : "Published"}>
                    {updatedAt ? "Updated " : "Published "}
                    <span className="whitespace-nowrap">{formatContentStamp(stamp)}</span>
                  </span>
                </>
              )}
            </div>
            <span className="mt-2 block text-sm font-medium text-teal">Learn more →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}