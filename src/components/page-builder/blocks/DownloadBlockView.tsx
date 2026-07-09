import { ButtonLink } from "@/components/ui/ButtonLink";
import type { DownloadBlockProps } from "@/lib/cms/page-builder-types";
import { Download } from "lucide-react";

export function DownloadBlockView({ props }: { props: DownloadBlockProps }) {
  return (
    <section className="container-verlin py-10 md:py-14">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <Download className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{props.title}</h2>
            {props.description ? (
              <p className="mt-1 text-sm text-text-secondary">{props.description}</p>
            ) : null}
            {props.fileLabel ? (
              <p className="mt-2 text-xs font-medium text-text-muted">{props.fileLabel}</p>
            ) : null}
          </div>
        </div>
        {props.buttonLabel ? (
          <ButtonLink href={props.fileHref || "/resources"} size="md">
            {props.buttonLabel}
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}
