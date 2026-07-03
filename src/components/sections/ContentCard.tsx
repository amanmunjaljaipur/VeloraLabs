"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface ContentCardProps {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  type: string;
  image: string;
}

export function ContentCard({
  slug,
  title,
  description,
  duration,
  level,
  type,
  image,
}: ContentCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/library/${slug}`} className="group block h-full">
        <Card hover className="flex h-full flex-col overflow-hidden p-0">
          <div className="relative h-44 overflow-hidden">
            <Image
              src={image}
              alt={`${title} cover`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 300px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="difficulty">{level}</Badge>
              <Badge>{type}</Badge>
            </div>
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-teal">
              {title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary line-clamp-3">
              {description}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Clock className="h-4 w-4" />
                {duration}
              </span>
              <span className="text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                Read →
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}