import { buildHowToJsonLd, type HowToStepInput } from "@/lib/howto-schema";
import { SITE_ORIGIN } from "@/lib/seo";

interface HowToJsonLdProps {
  name: string;
  description: string;
  path: string;
  steps: HowToStepInput[];
  totalTime?: string;
}

export function HowToJsonLd({ name, description, path, steps, totalTime }: HowToJsonLdProps) {
  const jsonLd = buildHowToJsonLd({
    name,
    description,
    path,
    origin: SITE_ORIGIN,
    steps,
    totalTime,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}