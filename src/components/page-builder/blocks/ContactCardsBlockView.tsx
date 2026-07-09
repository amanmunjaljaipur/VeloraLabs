import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import type { ContactCardsBlockProps } from "@/lib/cms/page-builder-types";

export function ContactCardsBlockView({ props }: { props: ContactCardsBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {props.items.map((item, index) => (
          <Card key={`${item.title}-${index}`} className="flex h-full flex-col p-5">
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 flex-1 text-sm text-text-secondary">{item.description}</p>
            {item.linkLabel ? (
              <div className="mt-4">
                <ButtonLink href={item.linkHref || "/contact"} size="sm" variant="secondary">
                  {item.linkLabel}
                </ButtonLink>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
