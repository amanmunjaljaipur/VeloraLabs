import { ButtonLink } from "@/components/ui/ButtonLink";
import type { ButtonBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function ButtonBlockView({ props }: { props: ButtonBlockProps }) {
  if (!props.label) return null;

  return (
    <section className="container-verlin py-6">
      <div
        className={cn(
          "flex",
          props.align === "center" && "justify-center",
          props.align === "right" && "justify-end"
        )}
      >
        <ButtonLink href={props.href || "/"} variant={props.variant || "primary"} size="lg">
          {props.label}
        </ButtonLink>
      </div>
    </section>
  );
}
