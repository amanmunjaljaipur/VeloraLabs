"use client";

import { Button } from "@/components/ui/Button";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { BRAND_MEDIA } from "@/lib/brand-media";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { SITE_IMAGE_ALT } from "@/lib/image-alt";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

/** Text left + ambient video right. */
export function ContactHero() {
  const reduceMotion = useReducedMotion();
  const media = BRAND_MEDIA.contact;

  return (
    <section className="relative overflow-hidden border-b border-border bg-[var(--canvas)]">
      <div className="container-verlin relative py-14 md:py-20">
        <div className="grid-editorial items-center lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="w-full max-w-xl text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
          >
            <p className="section-eyebrow">Contact</p>
            <h1 className="text-display mt-4">
              Let&apos;s talk about clarity-first learning
            </h1>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              Whether you&apos;re booking a session, exploring team programs, or pitching a
              partnership - we respond thoughtfully and without pressure.
            </p>
            <div className="mt-9 w-full max-w-full sm:w-fit">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="#contact-form" className="inline-flex">
                  <Button size="lg" variant="cta" className="w-full sm:min-w-[12rem]">
                    Send a message
                  </Button>
                </Link>
                <Link href="/free-session" className="inline-flex">
                  <Button size="lg" variant="secondary" className="w-full sm:min-w-[12rem]">
                    Book free session
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-[var(--bg-light)] shadow-[var(--shadow-sm)]"
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: DURATION.reveal, delay: 0.05, ease: EASE_OUT }}
          >
            <MediaFrame
              image={media.image}
              alt={SITE_IMAGE_ALT.contact}
              video={media.video}
              priority
              rounded={false}
              scrim="none"
              sharpText
              className="absolute inset-0 min-h-0"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
