import Link from "next/link";
import type { BannerBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const VARIANTS: Record<BannerBlockProps["variant"], string> = {
  info: "bg-teal/15 text-foreground border-teal/30",
  success: "bg-emerald-500/15 text-foreground border-emerald-500/30",
  warning: "bg-amber-500/15 text-foreground border-amber-500/30",
  dark: "bg-[#0a1628] text-white border-transparent",
};

export function BannerBlockView({ props }: { props: BannerBlockProps }) {
  return (
    <div
      className={cn(
        "border-b px-4 py-3 text-center text-sm md:text-base",
        VARIANTS[props.variant] ?? VARIANTS.info
      )}
      role="status"
    >
      <span>{props.text}</span>
      {props.linkLabel && props.linkHref ? (
        <>
          {" "}
          <Link
            href={props.linkHref}
            className="font-semibold underline underline-offset-2 hover:opacity-90"
          >
            {props.linkLabel}
          </Link>
        </>
      ) : null}
    </div>
  );
}
