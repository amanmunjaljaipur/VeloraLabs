import type { SpacerBlockProps } from "@/lib/cms/page-builder-types";

const HEIGHTS: Record<SpacerBlockProps["size"], string> = {
  sm: "h-8 md:h-12",
  md: "h-16 md:h-24",
  lg: "h-24 md:h-36",
  xl: "h-32 md:h-48",
};

export function SpacerBlockView({ props }: { props: SpacerBlockProps }) {
  return <div className={HEIGHTS[props.size] ?? HEIGHTS.md} aria-hidden="true" />;
}
