export interface HowToStepInput {
  name: string;
  text: string;
  position?: number;
}

export function buildHowToJsonLd({
  name,
  description,
  path,
  origin,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  path: string;
  origin: string;
  steps: HowToStepInput[];
  totalTime?: string;
}) {
  const url = path === "/" ? origin : `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: step.position ?? index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}