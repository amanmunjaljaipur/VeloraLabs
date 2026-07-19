import type { AccordionItem } from "@/components/ui/Accordion";

export interface HomeContentData {
  hero: {
    headline: string;
    subheadline: string;
    illustration: string;
    illustrationAlt: string;
    /** Optional muted loop under public/videos */
    video?: string;
  };
  whatWeCover: string[];
  howItWorks: {
    step: number;
    title: string;
    description: string;
    icon: string;
  }[];
  howItWorksIllustration: { src: string; alt: string; video?: string };
  learningIllustrations: {
    mentalModels: { src: string; alt: string; video?: string };
    handsOn: { src: string; alt: string; video?: string };
  };
  homeFaqs: AccordionItem[];
  testimonialAvatars: Record<string, string>;
  freeSessionIllustration: { src: string; alt: string; video?: string };
}