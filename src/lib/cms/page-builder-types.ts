/**
 * AEM-style page builder component model.
 * Each block type mirrors a common AEM Core / marketing component.
 */

export type PageBlockType =
  // Layout
  | "hero"
  | "page-header"
  | "title"
  | "banner"
  | "divider"
  | "spacer"
  | "columns"
  | "three-columns"
  | "split"
  // Content
  | "rich-text"
  | "list"
  | "quote"
  | "callout"
  | "table"
  | "steps"
  | "tabs"
  | "accordion"
  | "features"
  | "cards"
  | "teaser"
  | "stats"
  | "agenda"
  | "comparison"
  | "pricing"
  | "faq"
  // Media
  | "image"
  | "gallery"
  | "video"
  | "embed"
  | "marquee"
  // Conversion
  | "button"
  | "button-group"
  | "cta"
  | "newsletter"
  | "download"
  | "form-cta"
  // Social proof & people
  | "testimonials"
  | "logos"
  | "team"
  | "contact-cards";

/* ── Shared primitives ─────────────────────────────────────────── */

export interface LinkItem {
  label: string;
  href: string;
}

export interface ImageRef {
  src: string;
  alt: string;
}

/* ── Layout ────────────────────────────────────────────────────── */

export interface HeroBlockProps {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
}

export interface PageHeaderBlockProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  align: "left" | "center";
}

export interface TitleBlockProps {
  text: string;
  level: "h1" | "h2" | "h3";
  align: "left" | "center";
  eyebrow: string;
}

export interface BannerBlockProps {
  text: string;
  linkLabel: string;
  linkHref: string;
  variant: "info" | "success" | "warning" | "dark";
}

export interface DividerBlockProps {
  style: "line" | "dots" | "none";
  label: string;
}

export interface SpacerBlockProps {
  size: "sm" | "md" | "lg" | "xl";
}

export interface ColumnsBlockProps {
  leftHtml: string;
  rightHtml: string;
  ratio: "1-1" | "2-1" | "1-2";
}

export interface ThreeColumnsBlockProps {
  col1Html: string;
  col2Html: string;
  col3Html: string;
}

export interface SplitBlockProps {
  eyebrow: string;
  title: string;
  bodyHtml: string;
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  ctaLabel: string;
  ctaHref: string;
}

/* ── Content ───────────────────────────────────────────────────── */

export interface RichTextBlockProps {
  html: string;
}

export interface ListBlockProps {
  title: string;
  style: "bullet" | "numbered" | "check";
  items: string[];
}

export interface QuoteBlockProps {
  quote: string;
  attribution: string;
  role: string;
}

export interface CalloutBlockProps {
  title: string;
  body: string;
  variant: "info" | "tip" | "warning" | "success";
}

export interface TableBlockProps {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface StepItem {
  title: string;
  description: string;
}

export interface StepsBlockProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: StepItem[];
}

export interface TabItem {
  label: string;
  html: string;
}

export interface TabsBlockProps {
  title: string;
  items: TabItem[];
}

export interface AccordionItemBlock {
  title: string;
  body: string;
}

export interface AccordionBlockProps {
  title: string;
  subtitle: string;
  items: AccordionItemBlock[];
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeaturesBlockProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

export interface CardItem {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  linkLabel: string;
  linkHref: string;
}

export interface CardsBlockProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  columns: "2" | "3" | "4";
  items: CardItem[];
}

export interface TeaserBlockProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  linkLabel: string;
  linkHref: string;
  layout: "horizontal" | "vertical";
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsBlockProps {
  items: StatItem[];
}

export interface AgendaItem {
  time: string;
  title: string;
  description: string;
}

export interface AgendaBlockProps {
  title: string;
  subtitle: string;
  items: AgendaItem[];
}

export interface ComparisonRow {
  feature: string;
  colA: string;
  colB: string;
}

export interface ComparisonBlockProps {
  title: string;
  columnA: string;
  columnB: string;
  rows: ComparisonRow[];
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted: boolean;
}

export interface PricingBlockProps {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqBlockProps {
  title: string;
  subtitle: string;
  items: FaqItem[];
}

/* ── Media ─────────────────────────────────────────────────────── */

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption: string;
  linkHref: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export interface GalleryBlockProps {
  title: string;
  columns: "2" | "3" | "4";
  items: GalleryItem[];
}

export interface VideoBlockProps {
  url: string;
  title: string;
  caption: string;
}

export interface EmbedBlockProps {
  html: string;
  title: string;
  minHeight: string;
}

export interface MarqueeBlockProps {
  items: string[];
  speed: "slow" | "normal" | "fast";
}

/* ── Conversion ────────────────────────────────────────────────── */

export interface ButtonBlockProps {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "cta";
  align: "left" | "center" | "right";
}

export interface ButtonGroupBlockProps {
  buttons: Array<{ label: string; href: string; variant: "primary" | "secondary" | "cta" }>;
  align: "left" | "center" | "right";
}

export interface CtaBlockProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  variant: "teal" | "dark";
}

export interface NewsletterBlockProps {
  title: string;
  description: string;
  buttonLabel: string;
  privacyNote: string;
}

export interface DownloadBlockProps {
  title: string;
  description: string;
  fileLabel: string;
  fileHref: string;
  buttonLabel: string;
}

export interface FormCtaBlockProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  bullets: string[];
}

/* ── Social proof & people ─────────────────────────────────────── */

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  avatarAlt: string;
}

export interface TestimonialsBlockProps {
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

export interface LogoItem {
  name: string;
  image: string;
  imageAlt: string;
  href: string;
}

export interface LogosBlockProps {
  title: string;
  subtitle: string;
  items: LogoItem[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  imageAlt: string;
}

export interface TeamBlockProps {
  title: string;
  subtitle: string;
  members: TeamMember[];
}

export interface ContactCardItem {
  title: string;
  description: string;
  linkLabel: string;
  linkHref: string;
}

export interface ContactCardsBlockProps {
  title: string;
  subtitle: string;
  items: ContactCardItem[];
}

/* ── Union ─────────────────────────────────────────────────────── */

export type PageBlockProps =
  | HeroBlockProps
  | PageHeaderBlockProps
  | TitleBlockProps
  | BannerBlockProps
  | DividerBlockProps
  | SpacerBlockProps
  | ColumnsBlockProps
  | ThreeColumnsBlockProps
  | SplitBlockProps
  | RichTextBlockProps
  | ListBlockProps
  | QuoteBlockProps
  | CalloutBlockProps
  | TableBlockProps
  | StepsBlockProps
  | TabsBlockProps
  | AccordionBlockProps
  | FeaturesBlockProps
  | CardsBlockProps
  | TeaserBlockProps
  | StatsBlockProps
  | AgendaBlockProps
  | ComparisonBlockProps
  | PricingBlockProps
  | FaqBlockProps
  | ImageBlockProps
  | GalleryBlockProps
  | VideoBlockProps
  | EmbedBlockProps
  | MarqueeBlockProps
  | ButtonBlockProps
  | ButtonGroupBlockProps
  | CtaBlockProps
  | NewsletterBlockProps
  | DownloadBlockProps
  | FormCtaBlockProps
  | TestimonialsBlockProps
  | LogosBlockProps
  | TeamBlockProps
  | ContactCardsBlockProps;

export type PageBlock =
  | { id: string; type: "hero"; props: HeroBlockProps }
  | { id: string; type: "page-header"; props: PageHeaderBlockProps }
  | { id: string; type: "title"; props: TitleBlockProps }
  | { id: string; type: "banner"; props: BannerBlockProps }
  | { id: string; type: "divider"; props: DividerBlockProps }
  | { id: string; type: "spacer"; props: SpacerBlockProps }
  | { id: string; type: "columns"; props: ColumnsBlockProps }
  | { id: string; type: "three-columns"; props: ThreeColumnsBlockProps }
  | { id: string; type: "split"; props: SplitBlockProps }
  | { id: string; type: "rich-text"; props: RichTextBlockProps }
  | { id: string; type: "list"; props: ListBlockProps }
  | { id: string; type: "quote"; props: QuoteBlockProps }
  | { id: string; type: "callout"; props: CalloutBlockProps }
  | { id: string; type: "table"; props: TableBlockProps }
  | { id: string; type: "steps"; props: StepsBlockProps }
  | { id: string; type: "tabs"; props: TabsBlockProps }
  | { id: string; type: "accordion"; props: AccordionBlockProps }
  | { id: string; type: "features"; props: FeaturesBlockProps }
  | { id: string; type: "cards"; props: CardsBlockProps }
  | { id: string; type: "teaser"; props: TeaserBlockProps }
  | { id: string; type: "stats"; props: StatsBlockProps }
  | { id: string; type: "agenda"; props: AgendaBlockProps }
  | { id: string; type: "comparison"; props: ComparisonBlockProps }
  | { id: string; type: "pricing"; props: PricingBlockProps }
  | { id: string; type: "faq"; props: FaqBlockProps }
  | { id: string; type: "image"; props: ImageBlockProps }
  | { id: string; type: "gallery"; props: GalleryBlockProps }
  | { id: string; type: "video"; props: VideoBlockProps }
  | { id: string; type: "embed"; props: EmbedBlockProps }
  | { id: string; type: "marquee"; props: MarqueeBlockProps }
  | { id: string; type: "button"; props: ButtonBlockProps }
  | { id: string; type: "button-group"; props: ButtonGroupBlockProps }
  | { id: string; type: "cta"; props: CtaBlockProps }
  | { id: string; type: "newsletter"; props: NewsletterBlockProps }
  | { id: string; type: "download"; props: DownloadBlockProps }
  | { id: string; type: "form-cta"; props: FormCtaBlockProps }
  | { id: string; type: "testimonials"; props: TestimonialsBlockProps }
  | { id: string; type: "logos"; props: LogosBlockProps }
  | { id: string; type: "team"; props: TeamBlockProps }
  | { id: string; type: "contact-cards"; props: ContactCardsBlockProps };

export type BuilderPageStatus = "draft" | "published";

export interface BuilderPageContent {
  title: string;
  subtitle: string;
  seoDescription: string;
  layout: "builder";
  status: BuilderPageStatus;
  sections: PageBlock[];
  publishedSections: PageBlock[];
  bodyHtml?: string;
  heroImage?: string;
  heroImageAlt?: string;
}

export function isBuilderPageContent(
  content: unknown
): content is BuilderPageContent {
  return (
    typeof content === "object" &&
    content !== null &&
    (content as BuilderPageContent).layout === "builder"
  );
}

export function getBlockImageAlt(
  type: PageBlockType,
  props: PageBlockProps,
  fallback = "Decorative image"
): string {
  if (type === "hero") {
    const p = props as HeroBlockProps;
    return (p.imageAlt || p.headline || fallback).trim() || fallback;
  }
  if (type === "image") {
    const p = props as ImageBlockProps;
    return (p.alt || p.caption || fallback).trim() || fallback;
  }
  if (type === "split") {
    const p = props as SplitBlockProps;
    return (p.imageAlt || p.title || fallback).trim() || fallback;
  }
  if (type === "teaser") {
    const p = props as TeaserBlockProps;
    return (p.imageAlt || p.title || fallback).trim() || fallback;
  }
  return fallback;
}
