import { getAllCourseTracks } from "@/lib/content";
import { getIntroPricing } from "@/lib/pricing";

const TRACK_LABELS: Record<string, string> = {
  students: "School Students",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

export function buildPricingTableMarkdown(): string {
  const tracks = getAllCourseTracks();
  const header = "| Track | Intro price | List price | Duration |";
  const divider = "| --- | --- | --- | --- |";
  const rows = tracks.map(({ slug, course }) => {
    const p = getIntroPricing(course.price);
    const label = TRACK_LABELS[slug] ?? course.title;
    return `| ${label} | **${p.current}** | ${p.original} | ${course.duration} |`;
  });

  return [header, divider, ...rows].join("\n");
}