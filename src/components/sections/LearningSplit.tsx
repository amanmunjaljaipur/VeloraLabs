"use client";

import { MediaFrame } from "@/components/ui/MediaFrame";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

interface LearningSplitProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  video?: string | null;
  reverse?: boolean;
  illustration?: boolean;
  items?: string[];
  toolIcons?: boolean;
}

export function LearningSplit({
  title,
  description,
  image,
  imageAlt,
  video,
  reverse,
  items,
}: LearningSplitProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "grid-editorial items-center lg:grid-cols-2 lg:gap-16 xl:gap-20",
        reverse && "lg:[&>*:first-child]:order-2"
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: DURATION.reveal + 0.06, ease: EASE_OUT }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/80 shadow-[var(--shadow-md)]">
        <MediaFrame
          image={image}
          alt={imageAlt}
          video={video}
          rounded={false}
          scrim="none"
          sharpText
          className="absolute inset-0 min-h-0"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      <div className="min-w-0 text-left">
        <h3 className="section-title mt-0">{title}</h3>
        <p className="section-subtitle mt-4 max-w-none">
          {description}
        </p>
        {items && items.length > 0 && (
          <ul className="list-verlin mt-7 max-w-md text-left md:mt-8">
            {items.map((item, index) => (
              <li key={item}>
                <span className="list-verlin-marker" aria-hidden="true">
                  <Check strokeWidth={3} />
                </span>
                <span>
                  <span className="sr-only">Point {index + 1}: </span>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
