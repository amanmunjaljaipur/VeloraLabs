"use client";

import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { MotionReveal } from "@/components/ui/MotionReveal";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, ListChecks, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ModelSummary {
  slug: string;
  name: string;
  shortDescription: string;
  difficulty: string;
  readTime: string;
}

interface ModelDetail extends ModelSummary {
  description: string;
  whyItMatters: string;
  keyPrinciples: string[];
  howToApply: string[];
  examples: { title: string; description: string }[];
  commonMistakes: string[];
  keyTakeaway: string;
}

/**
 * Interactive demo - real data pulled live from our public API
 * (/api/public/mental-models), not a canned mockup. Picking a model here
 * hits the same endpoint developers integrate with (see /docs/api).
 */
export function DemoClient({ initialModels }: { initialModels: ModelSummary[] }) {
  const [models] = useState(initialModels);
  const [selectedSlug, setSelectedSlug] = useState(initialModels[0]?.slug ?? "");
  const [detail, setDetail] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/mental-models?slug=${encodeURIComponent(selectedSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setDetail(data.model);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Pick a topic
        </p>
        {models.map((model) => (
          <button
            key={model.slug}
            type="button"
            onClick={() => setSelectedSlug(model.slug)}
            className={`block w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selectedSlug === model.slug
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-card text-foreground/80 hover:border-teal/40 hover:text-foreground"
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>

      <div>
        <AnimatePresence mode="wait">
          {loading || !detail ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[300px] items-center justify-center text-sm text-text-secondary"
            >
              Loading…
            </motion.div>
          ) : (
            <motion.div
              key={detail.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card variant="glass" className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="difficulty">{detail.difficulty}</Badge>
                  <span className="text-xs text-text-secondary">{detail.readTime}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">{detail.name}</h2>
                <p className="mt-3 leading-relaxed text-text-secondary">{detail.description}</p>

                <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent-teal/5 p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Why it matters</p>
                    <p className="mt-1 text-sm text-text-secondary">{detail.whyItMatters}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <ListChecks className="h-4 w-4 text-teal" aria-hidden="true" />
                      Key principles
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {detail.keyPrinciples.map((item) => (
                        <li key={item} className="text-sm text-text-secondary">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <XCircle className="h-4 w-4 text-cta-amber" aria-hidden="true" />
                      Common mistakes
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {detail.commonMistakes.map((item) => (
                        <li key={item} className="text-sm text-text-secondary">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Key takeaway</p>
                    <p className="mt-1 text-sm text-text-secondary">{detail.keyTakeaway}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <p className="text-sm text-text-secondary">
                    This is one of {models.length} mental models we teach live in every program.
                  </p>
                  <ButtonLink href="/free-session" variant="cta" size="md">
                    Book Free Session
                  </ButtonLink>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <MotionReveal className="mt-4">
          <p className="text-xs text-text-secondary">
            This demo runs on our public read-only API - see{" "}
            <a href="/docs/api" className="font-medium text-teal hover:underline">
              API docs
            </a>{" "}
            if you want to pull this content into your own tools.
          </p>
        </MotionReveal>
      </div>
    </div>
  );
}
