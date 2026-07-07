import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MentalModel } from "@/lib/content";
import { formatContentDateTime } from "@/lib/utils";
import { AlertTriangle, BookOpen, Calendar, CheckCircle2, Clock, Lightbulb, ListOrdered } from "lucide-react";

interface MentalModelArticleProps {
  model: MentalModel;
}

export function MentalModelArticle({ model }: MentalModelArticleProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 pb-16 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="difficulty">{model.difficulty}</Badge>
        <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
          <Clock className="h-4 w-4 text-teal" />
          {model.readTime}
        </span>
        {model.publishedAt && (
          <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
            <Calendar className="h-4 w-4 text-teal" />
            Published {formatContentDateTime(model.publishedAt)}
          </span>
        )}
        {model.updatedAt && (
          <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
            Updated {formatContentDateTime(model.updatedAt)}
          </span>
        )}
      </div>

      <Card className="border-teal/20 bg-teal/5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="mt-3 text-base leading-relaxed text-text-secondary">{model.description}</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Why it matters</h2>
        <p className="mt-4 text-base leading-relaxed text-text-secondary">{model.whyItMatters}</p>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-teal" />
          <h2 className="text-xl font-semibold text-foreground">Key principles</h2>
        </div>
        <ul className="mt-5 space-y-3">
          {model.keyPrinciples.map((principle) => (
            <li key={principle} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <span className="text-sm leading-relaxed text-text-secondary">{principle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-teal" />
          <h2 className="text-xl font-semibold text-foreground">How to apply it</h2>
        </div>
        <ol className="mt-5 space-y-4">
          {model.howToApply.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-semibold text-teal">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-text-secondary">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Real-world examples</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {model.examples.map((example) => (
            <Card key={example.title} className="h-full">
              <h3 className="font-semibold text-foreground">{example.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{example.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-semibold text-foreground">Common mistakes</h2>
        </div>
        <ul className="mt-5 space-y-2">
          {model.commonMistakes.map((mistake) => (
            <li key={mistake} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {mistake}
            </li>
          ))}
        </ul>
      </section>

      <Card className="border-teal/30 bg-gradient-to-br from-teal/10 to-transparent">
        <p className="text-xs font-medium uppercase tracking-wider text-teal">Key takeaway</p>
        <p className="mt-3 text-base font-medium leading-relaxed text-foreground">{model.keyTakeaway}</p>
      </Card>
    </div>
  );
}