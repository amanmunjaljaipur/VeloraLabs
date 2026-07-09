import { Card } from "@/components/ui/Card";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { TestimonialsBlockProps } from "@/lib/cms/page-builder-types";

export function TestimonialsBlockView({ props }: { props: TestimonialsBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {props.items.map((item, index) => (
          <Card key={`${item.name}-${index}`} className="flex h-full flex-col p-6">
            <blockquote className="flex-1 text-base leading-relaxed text-foreground">
              <span className="text-2xl leading-none text-teal" aria-hidden="true">
                “
              </span>
              {item.quote}
            </blockquote>
            <footer className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              {item.avatar ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                  <OptimizedImage
                    src={item.avatar}
                    alt={item.avatarAlt || item.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : null}
              <div>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                {item.role ? <p className="text-xs text-text-secondary">{item.role}</p> : null}
              </div>
            </footer>
          </Card>
        ))}
      </div>
    </section>
  );
}
