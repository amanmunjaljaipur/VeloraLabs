import { ButtonLink } from "@/components/ui/ButtonLink";
import type { ButtonGroupBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function ButtonGroupBlockView({ props }: { props: ButtonGroupBlockProps }) {
  if (!props.buttons?.length) return null;

  return (
    <section className="container-verlin py-6">
      <div
        className={cn(
          "flex flex-wrap gap-3",
          props.align === "center" && "justify-center",
          props.align === "right" && "justify-end"
        )}
      >
        {props.buttons.map((btn, index) => (
          <ButtonLink
            key={`${btn.label}-${index}`}
            href={btn.href || "/"}
            variant={btn.variant || "primary"}
            size="lg"
          >
            {btn.label}
          </ButtonLink>
        ))}
      </div>
    </section>
  );
}
