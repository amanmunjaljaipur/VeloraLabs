import type { AccordionItem } from "@/components/ui/Accordion";

export interface HomeContentData {
  hero: {
    headline: string;
    subheadline: string;
    illustration: string;
    illustrationAlt: string;
  };
  whatWeCover: string[];
  howItWorks: {
    step: number;
    title: string;
    description: string;
    icon: string;
  }[];
  howItWorksIllustration: { src: string; alt: string };
  learningIllustrations: {
    mentalModels: { src: string; alt: string };
    handsOn: { src: string; alt: string };
  };
  homeFaqs: AccordionItem[];
  testimonialAvatars: Record<string, string>;
  freeSessionIllustration: { src: string; alt: string };
}