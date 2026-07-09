import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import type { PricingBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function PricingBlockView({ props }: { props: PricingBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        {props.plans.map((plan, index) => (
          <Card
            key={`${plan.name}-${index}`}
            className={cn(
              "flex h-full flex-col p-6",
              plan.highlighted && "border-accent-teal ring-2 ring-accent-teal/30"
            )}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-3 text-3xl font-bold tracking-tight text-teal">
              {plan.price}
              {plan.period ? (
                <span className="ml-1 text-sm font-normal text-text-secondary">/ {plan.period}</span>
              ) : null}
            </p>
            {plan.description ? (
              <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
            ) : null}
            <ul className="mt-6 flex-1 space-y-2">
              {plan.features.map((feature, fi) => (
                <li key={fi} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.ctaLabel ? (
              <div className="mt-6">
                <ButtonLink href={plan.ctaHref || "/"} size="md" fullWidth>
                  {plan.ctaLabel}
                </ButtonLink>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
