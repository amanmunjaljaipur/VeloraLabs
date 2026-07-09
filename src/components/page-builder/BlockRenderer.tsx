import type { PageBlock } from "@/lib/cms/page-builder-types";
import { BlockErrorBoundary } from "@/components/page-builder/BlockErrorBoundary";
import { AccordionBlockView } from "@/components/page-builder/blocks/AccordionBlockView";
import { AgendaBlockView } from "@/components/page-builder/blocks/AgendaBlockView";
import { BannerBlockView } from "@/components/page-builder/blocks/BannerBlockView";
import { ButtonBlockView } from "@/components/page-builder/blocks/ButtonBlockView";
import { ButtonGroupBlockView } from "@/components/page-builder/blocks/ButtonGroupBlockView";
import { CalloutBlockView } from "@/components/page-builder/blocks/CalloutBlockView";
import { CardsBlockView } from "@/components/page-builder/blocks/CardsBlockView";
import { ColumnsBlockView } from "@/components/page-builder/blocks/ColumnsBlockView";
import { ComparisonBlockView } from "@/components/page-builder/blocks/ComparisonBlockView";
import { ContactCardsBlockView } from "@/components/page-builder/blocks/ContactCardsBlockView";
import { CtaBlockView } from "@/components/page-builder/blocks/CtaBlockView";
import { DividerBlockView } from "@/components/page-builder/blocks/DividerBlockView";
import { DownloadBlockView } from "@/components/page-builder/blocks/DownloadBlockView";
import { EmbedBlockView } from "@/components/page-builder/blocks/EmbedBlockView";
import { FaqBlockView } from "@/components/page-builder/blocks/FaqBlockView";
import { FeaturesBlockView } from "@/components/page-builder/blocks/FeaturesBlockView";
import { FormCtaBlockView } from "@/components/page-builder/blocks/FormCtaBlockView";
import { GalleryBlockView } from "@/components/page-builder/blocks/GalleryBlockView";
import { HeroBlockView } from "@/components/page-builder/blocks/HeroBlockView";
import { ImageBlockView } from "@/components/page-builder/blocks/ImageBlockView";
import { ListBlockView } from "@/components/page-builder/blocks/ListBlockView";
import { LogosBlockView } from "@/components/page-builder/blocks/LogosBlockView";
import { MarqueeBlockView } from "@/components/page-builder/blocks/MarqueeBlockView";
import { NewsletterBlockView } from "@/components/page-builder/blocks/NewsletterBlockView";
import { PageHeaderBlockView } from "@/components/page-builder/blocks/PageHeaderBlockView";
import { PricingBlockView } from "@/components/page-builder/blocks/PricingBlockView";
import { QuoteBlockView } from "@/components/page-builder/blocks/QuoteBlockView";
import { RichTextBlockView } from "@/components/page-builder/blocks/RichTextBlockView";
import { SpacerBlockView } from "@/components/page-builder/blocks/SpacerBlockView";
import { SplitBlockView } from "@/components/page-builder/blocks/SplitBlockView";
import { StatsBlockView } from "@/components/page-builder/blocks/StatsBlockView";
import { StepsBlockView } from "@/components/page-builder/blocks/StepsBlockView";
import { TableBlockView } from "@/components/page-builder/blocks/TableBlockView";
import { TabsBlockView } from "@/components/page-builder/blocks/TabsBlockView";
import { TeamBlockView } from "@/components/page-builder/blocks/TeamBlockView";
import { TeaserBlockView } from "@/components/page-builder/blocks/TeaserBlockView";
import { TestimonialsBlockView } from "@/components/page-builder/blocks/TestimonialsBlockView";
import { ThreeColumnsBlockView } from "@/components/page-builder/blocks/ThreeColumnsBlockView";
import { TitleBlockView } from "@/components/page-builder/blocks/TitleBlockView";
import { VideoBlockView } from "@/components/page-builder/blocks/VideoBlockView";

export function BlockRenderer({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "hero":
      return <HeroBlockView props={block.props} />;
    case "page-header":
      return <PageHeaderBlockView props={block.props} />;
    case "title":
      return <TitleBlockView props={block.props} />;
    case "banner":
      return <BannerBlockView props={block.props} />;
    case "divider":
      return <DividerBlockView props={block.props} />;
    case "spacer":
      return <SpacerBlockView props={block.props} />;
    case "columns":
      return <ColumnsBlockView props={block.props} />;
    case "three-columns":
      return <ThreeColumnsBlockView props={block.props} />;
    case "split":
      return <SplitBlockView props={block.props} />;
    case "rich-text":
      return <RichTextBlockView props={block.props} />;
    case "list":
      return <ListBlockView props={block.props} />;
    case "quote":
      return <QuoteBlockView props={block.props} />;
    case "callout":
      return <CalloutBlockView props={block.props} />;
    case "table":
      return <TableBlockView props={block.props} />;
    case "steps":
      return <StepsBlockView props={block.props} />;
    case "tabs":
      return <TabsBlockView props={block.props} />;
    case "accordion":
      return <AccordionBlockView props={block.props} />;
    case "features":
      return <FeaturesBlockView props={block.props} />;
    case "cards":
      return <CardsBlockView props={block.props} />;
    case "teaser":
      return <TeaserBlockView props={block.props} />;
    case "stats":
      return <StatsBlockView props={block.props} />;
    case "agenda":
      return <AgendaBlockView props={block.props} />;
    case "comparison":
      return <ComparisonBlockView props={block.props} />;
    case "pricing":
      return <PricingBlockView props={block.props} />;
    case "faq":
      return <FaqBlockView props={block.props} />;
    case "image":
      return <ImageBlockView props={block.props} />;
    case "gallery":
      return <GalleryBlockView props={block.props} />;
    case "video":
      return <VideoBlockView props={block.props} />;
    case "embed":
      return <EmbedBlockView props={block.props} />;
    case "marquee":
      return <MarqueeBlockView props={block.props} />;
    case "button":
      return <ButtonBlockView props={block.props} />;
    case "button-group":
      return <ButtonGroupBlockView props={block.props} />;
    case "cta":
      return <CtaBlockView props={block.props} />;
    case "newsletter":
      return <NewsletterBlockView props={block.props} />;
    case "download":
      return <DownloadBlockView props={block.props} />;
    case "form-cta":
      return <FormCtaBlockView props={block.props} />;
    case "testimonials":
      return <TestimonialsBlockView props={block.props} />;
    case "logos":
      return <LogosBlockView props={block.props} />;
    case "team":
      return <TeamBlockView props={block.props} />;
    case "contact-cards":
      return <ContactCardsBlockView props={block.props} />;
    default:
      return null;
  }
}

export function PageBuilderRenderer({ sections }: { sections: PageBlock[] }) {
  if (!sections?.length) {
    return (
      <div className="container-verlin py-20 text-center text-sm text-text-secondary">
        This page has no published content yet.
      </div>
    );
  }

  return (
    <>
      {sections.map((block) => (
        <BlockErrorBoundary key={block.id} blockType={block.type}>
          <BlockRenderer block={block} />
        </BlockErrorBoundary>
      ))}
    </>
  );
}
