import { AuthorByline } from "@/components/sections/AuthorByline";
import { ArticleLearningPath } from "@/components/sections/ArticleLearningPath";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { LibraryItem } from "@/lib/content";
import { formatContentDateTime } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { libraryCoverAlt } from "@/lib/image-alt";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const audienceLabels = {
  all: "All learners",
  students: "Students",
  engineers: "Engineers",
  professionals: "Professionals",
} as const;

interface LibraryArticleProps {
  item: LibraryItem;
}

export function LibraryArticle({ item }: LibraryArticleProps) {
  return (
    <article>
      <div className="relative h-56 overflow-hidden border-b border-border sm:h-72 md:h-96">
        <OptimizedImage
          src={item.image}
          alt={libraryCoverAlt(item.title, item.type)}
          fill
          aboveFold
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          {item.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="difficulty">{item.level}</Badge>
          <Badge>{item.type}</Badge>
          <Badge>{audienceLabels[item.audience]}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Published {formatContentDateTime(item.publishedAt)}
          </span>
          {item.updatedAt && (
            <span className="inline-flex items-center gap-1.5">
              Updated {formatContentDateTime(item.updatedAt)}
            </span>
          )}
          <span>{item.duration} read</span>
        </div>

        <p className="mt-6 text-lg leading-relaxed text-text-secondary">{item.summary}</p>

        <AuthorByline />
        <ArticleLearningPath item={item} />

        <div className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {item.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="mt-4 text-base leading-relaxed text-text-secondary">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-base leading-relaxed text-text-secondary"
                    >
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <Card className="mt-12 border-teal/30 bg-gradient-to-br from-teal/10 to-transparent">
          <p className="text-xs font-medium uppercase tracking-wider text-teal">Key takeaway</p>
          <p className="mt-3 text-base font-medium leading-relaxed text-foreground">{item.keyTakeaway}</p>
        </Card>
      </div>
    </article>
  );
}