import type {
  AccordionBlockProps,
  AgendaBlockProps,
  BannerBlockProps,
  ButtonBlockProps,
  ButtonGroupBlockProps,
  CalloutBlockProps,
  CardsBlockProps,
  ColumnsBlockProps,
  ComparisonBlockProps,
  ContactCardsBlockProps,
  CtaBlockProps,
  DividerBlockProps,
  DownloadBlockProps,
  EmbedBlockProps,
  FaqBlockProps,
  FeaturesBlockProps,
  FormCtaBlockProps,
  GalleryBlockProps,
  HeroBlockProps,
  ImageBlockProps,
  ListBlockProps,
  LogosBlockProps,
  MarqueeBlockProps,
  NewsletterBlockProps,
  PageBlock,
  PageBlockType,
  PageHeaderBlockProps,
  PricingBlockProps,
  QuoteBlockProps,
  RichTextBlockProps,
  SpacerBlockProps,
  SplitBlockProps,
  StatsBlockProps,
  StepsBlockProps,
  TableBlockProps,
  TabsBlockProps,
  TeamBlockProps,
  TeaserBlockProps,
  TestimonialsBlockProps,
  ThreeColumnsBlockProps,
  TitleBlockProps,
  VideoBlockProps,
} from "@/lib/cms/page-builder-types";
import type { LucideIcon } from "lucide-react";
import {
  AlignVerticalSpaceAround,
  BadgeIndianRupee,
  Columns2,
  Columns3,
  Contact,
  Download,
  FormInput,
  GalleryHorizontalEnd,
  Grid3x3,
  HelpCircle,
  Image as ImageIcon,
  LayoutTemplate,
  List,
  ListOrdered,
  Mail,
  Megaphone,
  MessageSquareQuote,
  MousePointerClick,
  PanelTop,
  Quote,
  Rows3,
  SeparatorHorizontal,
  Shield,
  SplitSquareHorizontal,
  SquareStack,
  Table,
  AppWindow,
  Type,
  Users,
  Video,
  BarChart3,
  Code2,
  AlertCircle,
  CalendarClock,
  ArrowLeftRight,
  GalleryThumbnails,
  TextCursorInput,
  CircleDot,
  LayoutGrid,
} from "lucide-react";

export type BlockCategory =
  | "Layout"
  | "Content"
  | "Media"
  | "Conversion"
  | "Social proof";

export interface BlockDefinition {
  type: PageBlockType;
  label: string;
  description: string;
  /** AEM Core / WCM equivalent for editors who know AEM */
  aemEquivalent: string;
  icon: LucideIcon;
  category: BlockCategory;
}

/**
 * Full AEM-style component library for the design studio.
 * Keep types → defaults → palette → views in sync via this registry.
 */
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Layout
  {
    type: "hero",
    label: "Hero banner",
    description: "Full-width intro with headline, CTAs, and image",
    aemEquivalent: "Hero / Teaser (full-bleed)",
    icon: LayoutTemplate,
    category: "Layout",
  },
  {
    type: "page-header",
    label: "Page header",
    description: "Interior page title band with subtitle",
    aemEquivalent: "Title + Text (header region)",
    icon: PanelTop,
    category: "Layout",
  },
  {
    type: "title",
    label: "Title",
    description: "Standalone heading (H1–H3) with optional eyebrow",
    aemEquivalent: "Core Title",
    icon: TextCursorInput,
    category: "Layout",
  },
  {
    type: "banner",
    label: "Announcement banner",
    description: "Slim alert strip with optional link",
    aemEquivalent: "Alert / Experience Fragment banner",
    icon: Megaphone,
    category: "Layout",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal rule or labeled separator",
    aemEquivalent: "Core Separator",
    icon: SeparatorHorizontal,
    category: "Layout",
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Vertical breathing room between sections",
    aemEquivalent: "Layout Container spacing",
    icon: AlignVerticalSpaceAround,
    category: "Layout",
  },
  {
    type: "columns",
    label: "Two columns",
    description: "Side-by-side rich text containers",
    aemEquivalent: "Responsive Grid (2 cols)",
    icon: Columns2,
    category: "Layout",
  },
  {
    type: "three-columns",
    label: "Three columns",
    description: "Equal three-column rich text layout",
    aemEquivalent: "Responsive Grid (3 cols)",
    icon: Columns3,
    category: "Layout",
  },
  {
    type: "split",
    label: "Split content",
    description: "Text + image side-by-side (image left or right)",
    aemEquivalent: "Teaser (image + text)",
    icon: SplitSquareHorizontal,
    category: "Layout",
  },
  // Content
  {
    type: "rich-text",
    label: "Rich text",
    description: "Formatted body copy, lists, and headings",
    aemEquivalent: "Core Text",
    icon: Type,
    category: "Content",
  },
  {
    type: "list",
    label: "List",
    description: "Bullet, numbered, or checkmark list",
    aemEquivalent: "Core List",
    icon: List,
    category: "Content",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Pull quote with attribution",
    aemEquivalent: "Core Text (blockquote) / Quote",
    icon: Quote,
    category: "Content",
  },
  {
    type: "callout",
    label: "Callout / alert",
    description: "Highlighted tip, info, warning, or success box",
    aemEquivalent: "Alert component",
    icon: AlertCircle,
    category: "Content",
  },
  {
    type: "table",
    label: "Table",
    description: "Simple data table with headers and rows",
    aemEquivalent: "Core Table",
    icon: Table,
    category: "Content",
  },
  {
    type: "steps",
    label: "Process steps",
    description: "Numbered how-it-works sequence",
    aemEquivalent: "Process / Timeline component",
    icon: ListOrdered,
    category: "Content",
  },
  {
    type: "tabs",
    label: "Tabs",
    description: "Tabbed panels of rich content",
    aemEquivalent: "Core Tabs",
    icon: AppWindow,
    category: "Content",
  },
  {
    type: "accordion",
    label: "Accordion",
    description: "Expandable titled panels (not only FAQ)",
    aemEquivalent: "Core Accordion",
    icon: SquareStack,
    category: "Content",
  },
  {
    type: "features",
    label: "Feature grid",
    description: "Icon-style benefit cards in a grid",
    aemEquivalent: "Card / Teaser collection",
    icon: Rows3,
    category: "Content",
  },
  {
    type: "cards",
    label: "Card grid",
    description: "Image cards with title, body, and link",
    aemEquivalent: "Core Teaser (list)",
    icon: LayoutGrid,
    category: "Content",
  },
  {
    type: "teaser",
    label: "Teaser",
    description: "Single promo card: image, title, CTA",
    aemEquivalent: "Core Teaser",
    icon: Grid3x3,
    category: "Content",
  },
  {
    type: "stats",
    label: "Stats bar",
    description: "Key metrics in a horizontal row",
    aemEquivalent: "Stats / KPI component",
    icon: BarChart3,
    category: "Content",
  },
  {
    type: "agenda",
    label: "Agenda / schedule",
    description: "Timed session agenda items",
    aemEquivalent: "Event agenda component",
    icon: CalendarClock,
    category: "Content",
  },
  {
    type: "comparison",
    label: "Comparison table",
    description: "Side-by-side feature comparison (A vs B)",
    aemEquivalent: "Comparison table",
    icon: ArrowLeftRight,
    category: "Content",
  },
  {
    type: "pricing",
    label: "Pricing plans",
    description: "Multi-tier pricing cards with CTAs",
    aemEquivalent: "Pricing / Offer component",
    icon: BadgeIndianRupee,
    category: "Content",
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Q&A accordion optimized for SEO",
    aemEquivalent: "FAQ Accordion",
    icon: HelpCircle,
    category: "Content",
  },
  // Media
  {
    type: "image",
    label: "Image",
    description: "Single image with alt text, caption, optional link",
    aemEquivalent: "Core Image",
    icon: ImageIcon,
    category: "Media",
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "Multi-image grid with captions and alt text",
    aemEquivalent: "Core Image List / Gallery",
    icon: GalleryThumbnails,
    category: "Media",
  },
  {
    type: "video",
    label: "Video embed",
    description: "YouTube video with accessible title",
    aemEquivalent: "Core Embed (video)",
    icon: Video,
    category: "Media",
  },
  {
    type: "embed",
    label: "HTML embed",
    description: "Safe iframe/HTML embed region (maps, widgets)",
    aemEquivalent: "Core Embed",
    icon: Code2,
    category: "Media",
  },
  {
    type: "marquee",
    label: "Topic marquee",
    description: "Scrolling strip of topics or keywords",
    aemEquivalent: "Marquee / Tag strip",
    icon: GalleryHorizontalEnd,
    category: "Media",
  },
  // Conversion
  {
    type: "button",
    label: "Button",
    description: "Single call-to-action button",
    aemEquivalent: "Core Button",
    icon: MousePointerClick,
    category: "Conversion",
  },
  {
    type: "button-group",
    label: "Button group",
    description: "Primary + secondary actions in a row",
    aemEquivalent: "Button group",
    icon: CircleDot,
    category: "Conversion",
  },
  {
    type: "cta",
    label: "CTA band",
    description: "Full-width conversion section",
    aemEquivalent: "CTA / Teaser band",
    icon: Megaphone,
    category: "Conversion",
  },
  {
    type: "newsletter",
    label: "Newsletter signup",
    description: "Email capture band linking to newsletter",
    aemEquivalent: "Form / Newsletter component",
    icon: Mail,
    category: "Conversion",
  },
  {
    type: "download",
    label: "Download",
    description: "Resource download card (PDF, guide, workbook)",
    aemEquivalent: "Core Download",
    icon: Download,
    category: "Conversion",
  },
  {
    type: "form-cta",
    label: "Lead form CTA",
    description: "Form-style lead section that links to booking/contact",
    aemEquivalent: "Core Form (simplified)",
    icon: FormInput,
    category: "Conversion",
  },
  // Social proof
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Learner quotes with optional avatars",
    aemEquivalent: "Testimonial / Quote list",
    icon: MessageSquareQuote,
    category: "Social proof",
  },
  {
    type: "logos",
    label: "Logo strip",
    description: "Trust logos / partner marks",
    aemEquivalent: "Logo cloud / Image list",
    icon: Shield,
    category: "Social proof",
  },
  {
    type: "team",
    label: "Team / people",
    description: "Instructor or team member cards",
    aemEquivalent: "People / Profile cards",
    icon: Users,
    category: "Social proof",
  },
  {
    type: "contact-cards",
    label: "Contact cards",
    description: "Ways to connect: email, form, booking",
    aemEquivalent: "Contact / Link list cards",
    icon: Contact,
    category: "Social proof",
  },
];

export function createBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultBlock(type: PageBlockType): PageBlock {
  const id = createBlockId();

  switch (type) {
    case "hero":
      return {
        id,
        type,
        props: {
          eyebrow: "Verlin Labs",
          headline: "Design your own learning page",
          subheadline: "Drag components, edit copy, preview, then publish when ready.",
          ctaLabel: "Book free session",
          ctaHref: "/free-session",
          secondaryCtaLabel: "Explore programs",
          secondaryCtaHref: "/programs",
          image: "/images/hero-home-visual.jpg",
          imageAlt: "Verlin Labs hero illustration showing clarity-first AI learning",
        } satisfies HeroBlockProps,
      };
    case "page-header":
      return {
        id,
        type,
        props: {
          eyebrow: "Verlin Labs",
          title: "Page title",
          subtitle: "A short subtitle that explains this page.",
          align: "left",
        } satisfies PageHeaderBlockProps,
      };
    case "title":
      return {
        id,
        type,
        props: {
          text: "Section title",
          level: "h2",
          align: "left",
          eyebrow: "",
        } satisfies TitleBlockProps,
      };
    case "banner":
      return {
        id,
        type,
        props: {
          text: "Limited seats for the next free session — book your spot.",
          linkLabel: "Book now",
          linkHref: "/free-session",
          variant: "info",
        } satisfies BannerBlockProps,
      };
    case "divider":
      return {
        id,
        type,
        props: { style: "line", label: "" } satisfies DividerBlockProps,
      };
    case "spacer":
      return {
        id,
        type,
        props: { size: "md" } satisfies SpacerBlockProps,
      };
    case "columns":
      return {
        id,
        type,
        props: {
          leftHtml: "<h3>Left column</h3><p>Use this for a benefit, step, or comparison point.</p>",
          rightHtml: "<h3>Right column</h3><p>Pair it with supporting detail or a second angle.</p>",
          ratio: "1-1",
        } satisfies ColumnsBlockProps,
      };
    case "three-columns":
      return {
        id,
        type,
        props: {
          col1Html: "<h3>Column 1</h3><p>First point.</p>",
          col2Html: "<h3>Column 2</h3><p>Second point.</p>",
          col3Html: "<h3>Column 3</h3><p>Third point.</p>",
        } satisfies ThreeColumnsBlockProps,
      };
    case "split":
      return {
        id,
        type,
        props: {
          eyebrow: "Learn by doing",
          title: "Clarity-first sessions",
          bodyHtml:
            "<p>Live workshops, mental models, and projects — structured so complex AI ideas finally stick.</p>",
          image: "/images/workshop.jpg",
          imageAlt: "Learners in a Verlin Labs workshop",
          imagePosition: "right",
          ctaLabel: "See how it works",
          ctaHref: "/free-session",
        } satisfies SplitBlockProps,
      };
    case "rich-text":
      return {
        id,
        type,
        props: {
          html: "<p>Add your content here. Explain your program, audience, or offer in clear language.</p>",
        } satisfies RichTextBlockProps,
      };
    case "list":
      return {
        id,
        type,
        props: {
          title: "What you will get",
          style: "check",
          items: [
            "Live interactive sessions",
            "Mental models that stick",
            "Hands-on practice",
          ],
        } satisfies ListBlockProps,
      };
    case "quote":
      return {
        id,
        type,
        props: {
          quote: "The mental models finally made AI feel practical instead of overwhelming.",
          attribution: "Aarav",
          role: "College engineer",
        } satisfies QuoteBlockProps,
      };
    case "callout":
      return {
        id,
        type,
        props: {
          title: "Pro tip",
          body: "Start with the free session to experience our teaching style before enrolling in a full track.",
          variant: "tip",
        } satisfies CalloutBlockProps,
      };
    case "table":
      return {
        id,
        type,
        props: {
          caption: "Program overview",
          headers: ["Track", "Audience", "Duration"],
          rows: [
            ["Students", "Classes 6–12", "Live sessions"],
            ["Engineers", "College & early career", "Project-based"],
            ["Product Managers", "PMs & product teams", "Applied AI"],
          ],
        } satisfies TableBlockProps,
      };
    case "steps":
      return {
        id,
        type,
        props: {
          eyebrow: "How it works",
          title: "Three steps to clarity",
          subtitle: "From first session to confident application.",
          items: [
            { title: "Book a free session", description: "Experience the teaching style live — no payment required." },
            { title: "Pick your track", description: "Students, engineers, or product managers — each path is tailored." },
            { title: "Build & apply", description: "Mental models plus projects you can use immediately." },
          ],
        } satisfies StepsBlockProps,
      };
    case "tabs":
      return {
        id,
        type,
        props: {
          title: "Choose your path",
          items: [
            { label: "Students", html: "<p>Mental models and safe AI use for Classes 6–12.</p>" },
            { label: "Engineers", html: "<p>LLM fundamentals, projects, and interview-ready skills.</p>" },
            { label: "PMs", html: "<p>Applied AI for product decisions and roadmaps.</p>" },
          ],
        } satisfies TabsBlockProps,
      };
    case "accordion":
      return {
        id,
        type,
        props: {
          title: "More details",
          subtitle: "Expand sections to learn more.",
          items: [
            { title: "Curriculum depth", body: "Each track balances theory, demos, and hands-on work." },
            { title: "Support", body: "Live Q&A and structured materials after sessions." },
          ],
        } satisfies AccordionBlockProps,
      };
    case "features":
      return {
        id,
        type,
        props: {
          eyebrow: "Why Verlin Labs",
          title: "Clarity-first learning",
          subtitle: "Mental models, live sessions, and hands-on practice.",
          items: [
            { title: "Live sessions", description: "Interactive workshops — not passive video dumps." },
            { title: "Mental models", description: "Frameworks that help complex AI ideas stick." },
            { title: "Hands-on projects", description: "Build something real you can showcase." },
          ],
        } satisfies FeaturesBlockProps,
      };
    case "cards":
      return {
        id,
        type,
        props: {
          eyebrow: "Programs",
          title: "Pick a track",
          subtitle: "Designed for how you learn and what you need next.",
          columns: "3",
          items: [
            {
              title: "Students",
              description: "AI fundamentals for Classes 6–12.",
              image: "/images/students.jpg",
              imageAlt: "School students learning AI",
              linkLabel: "View program",
              linkHref: "/courses/students",
            },
            {
              title: "Engineers",
              description: "LLMs, projects, and portfolio work.",
              image: "/images/engineers.jpg",
              imageAlt: "College engineers in a coding session",
              linkLabel: "View program",
              linkHref: "/courses/engineers",
            },
            {
              title: "Product Managers",
              description: "Applied AI for product decisions.",
              image: "/images/professionals.jpg",
              imageAlt: "Product managers collaborating",
              linkLabel: "View program",
              linkHref: "/courses/professionals",
            },
          ],
        } satisfies CardsBlockProps,
      };
    case "teaser":
      return {
        id,
        type,
        props: {
          eyebrow: "Free intro",
          title: "2-hour clarity session",
          description: "Meet the teaching style before you commit to a full program.",
          image: "/images/workshop.jpg",
          imageAlt: "Live free session workshop",
          linkLabel: "Book free session",
          linkHref: "/free-session",
          layout: "horizontal",
        } satisfies TeaserBlockProps,
      };
    case "stats":
      return {
        id,
        type,
        props: {
          items: [
            { value: "3", label: "Learning tracks" },
            { value: "16", label: "Max program days" },
            { value: "2hr", label: "Free intro session" },
            { value: "100%", label: "Clarity-first approach" },
          ],
        } satisfies StatsBlockProps,
      };
    case "agenda":
      return {
        id,
        type,
        props: {
          title: "Session agenda",
          subtitle: "What we cover in the free intro.",
          items: [
            { time: "0:00", title: "Welcome & goals", description: "What success looks like today." },
            { time: "0:20", title: "Mental models", description: "Frameworks for understanding AI clearly." },
            { time: "1:00", title: "Live demo", description: "Practical tools and patterns." },
            { time: "1:40", title: "Q&A", description: "Your questions answered live." },
          ],
        } satisfies AgendaBlockProps,
      };
    case "comparison":
      return {
        id,
        type,
        props: {
          title: "How we compare",
          columnA: "Typical courses",
          columnB: "Verlin Labs",
          rows: [
            { feature: "Format", colA: "Recorded videos", colB: "Live interactive sessions" },
            { feature: "Focus", colA: "Tool tutorials", colB: "Mental models + practice" },
            { feature: "Audience", colA: "One-size-fits-all", colB: "Track-specific paths" },
          ],
        } satisfies ComparisonBlockProps,
      };
    case "pricing":
      return {
        id,
        type,
        props: {
          title: "Programs & pricing",
          subtitle: "Clear options — start free, upgrade when ready.",
          plans: [
            {
              name: "Free session",
              price: "₹0",
              period: "2 hours",
              description: "Live intro to our clarity-first method.",
              features: ["No credit card", "Live Q&A", "See teaching style"],
              ctaLabel: "Book free",
              ctaHref: "/free-session",
              highlighted: false,
            },
            {
              name: "Full track",
              price: "See page",
              period: "per program",
              description: "Structured path for your audience.",
              features: ["Live sessions", "Projects", "Mental models library"],
              ctaLabel: "View courses",
              ctaHref: "/courses",
              highlighted: true,
            },
          ],
        } satisfies PricingBlockProps,
      };
    case "faq":
      return {
        id,
        type,
        props: {
          title: "Frequently asked questions",
          subtitle: "Quick answers before you enroll or book.",
          items: [
            {
              question: "Is the free session really free?",
              answer: "Yes — no credit card required. It is a live 2-hour intro to our teaching style.",
            },
            {
              question: "Who is this for?",
              answer: "Students, engineers, and product managers — each with a tailored track.",
            },
          ],
        } satisfies FaqBlockProps,
      };
    case "image":
      return {
        id,
        type,
        props: {
          src: "/images/workshop.jpg",
          alt: "Live workshop session at Verlin Labs",
          caption: "",
          linkHref: "",
        } satisfies ImageBlockProps,
      };
    case "gallery":
      return {
        id,
        type,
        props: {
          title: "In the room",
          columns: "3",
          items: [
            { src: "/images/workshop.jpg", alt: "Workshop overview", caption: "" },
            { src: "/images/hero-side.jpg", alt: "Learning moment", caption: "" },
            { src: "/images/hero-home-visual.jpg", alt: "Session visual", caption: "" },
          ],
        } satisfies GalleryBlockProps,
      };
    case "video":
      return {
        id,
        type,
        props: {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Verlin Labs intro video",
          caption: "",
        } satisfies VideoBlockProps,
      };
    case "embed":
      return {
        id,
        type,
        props: {
          html: "",
          title: "Embedded content",
          minHeight: "320",
        } satisfies EmbedBlockProps,
      };
    case "marquee":
      return {
        id,
        type,
        props: {
          items: [
            "Mental models",
            "LLMs",
            "Prompt design",
            "Product AI",
            "Safe AI use",
            "Hands-on projects",
          ],
          speed: "normal",
        } satisfies MarqueeBlockProps,
      };
    case "button":
      return {
        id,
        type,
        props: {
          label: "Book free session",
          href: "/free-session",
          variant: "primary",
          align: "center",
        } satisfies ButtonBlockProps,
      };
    case "button-group":
      return {
        id,
        type,
        props: {
          buttons: [
            { label: "Book free session", href: "/free-session", variant: "primary" },
            { label: "Contact us", href: "/contact", variant: "secondary" },
          ],
          align: "center",
        } satisfies ButtonGroupBlockProps,
      };
    case "cta":
      return {
        id,
        type,
        props: {
          title: "Ready to get started?",
          description: "Book a free session or contact us to learn which track fits you.",
          buttonLabel: "Book free session",
          buttonHref: "/free-session",
          secondaryLabel: "Contact",
          secondaryHref: "/contact",
          variant: "teal",
        } satisfies CtaBlockProps,
      };
    case "newsletter":
      return {
        id,
        type,
        props: {
          title: "Get the weekly AI brief",
          description: "Short, practical updates on mental models and AI learning — no fluff.",
          buttonLabel: "Subscribe free",
          privacyNote: "We never share your email. Unsubscribe anytime.",
        } satisfies NewsletterBlockProps,
      };
    case "download":
      return {
        id,
        type,
        props: {
          title: "Free resource",
          description: "Download a practical workbook or cheat sheet to keep learning offline.",
          fileLabel: "Mental models cheat sheet",
          fileHref: "/resources/mental-models-cheat-sheet",
          buttonLabel: "Get free download",
        } satisfies DownloadBlockProps,
      };
    case "form-cta":
      return {
        id,
        type,
        props: {
          title: "Book your free session",
          description: "Reserve a seat — no payment required.",
          buttonLabel: "Continue to booking",
          buttonHref: "/free-session",
          bullets: ["2-hour live intro", "No credit card", "Ask anything"],
        } satisfies FormCtaBlockProps,
      };
    case "testimonials":
      return {
        id,
        type,
        props: {
          title: "What learners say",
          subtitle: "Real feedback from sessions and programs.",
          items: [
            {
              quote: "The mental models finally made AI feel practical instead of overwhelming.",
              name: "Aarav",
              role: "College engineer",
              avatar: "",
              avatarAlt: "",
            },
            {
              quote: "Clear, structured, and immediately useful for product work.",
              name: "Priya",
              role: "Product manager",
              avatar: "",
              avatarAlt: "",
            },
          ],
        } satisfies TestimonialsBlockProps,
      };
    case "logos":
      return {
        id,
        type,
        props: {
          title: "Trusted by learners from",
          subtitle: "Schools, colleges, and product teams across India.",
          items: [
            { name: "Partner 1", image: "", imageAlt: "Partner logo 1", href: "" },
            { name: "Partner 2", image: "", imageAlt: "Partner logo 2", href: "" },
            { name: "Partner 3", image: "", imageAlt: "Partner logo 3", href: "" },
          ],
        } satisfies LogosBlockProps,
      };
    case "team":
      return {
        id,
        type,
        props: {
          title: "Meet the instructor",
          subtitle: "Clarity-first teaching, live and hands-on.",
          members: [
            {
              name: "Aman Munjal",
              role: "Founder & instructor",
              bio: "Building clarity-first AI education through mental models and live practice.",
              image: "/images/aman.jpg",
              imageAlt: "Portrait of Aman Munjal",
            },
          ],
        } satisfies TeamBlockProps,
      };
    case "contact-cards":
      return {
        id,
        type,
        props: {
          title: "Ways to connect",
          subtitle: "Pick the path that fits your question.",
          items: [
            {
              title: "Book a session",
              description: "Free 2-hour live intro.",
              linkLabel: "Book now",
              linkHref: "/free-session",
            },
            {
              title: "Contact form",
              description: "Team training, partnerships, custom questions.",
              linkLabel: "Contact us",
              linkHref: "/contact",
            },
            {
              title: "Newsletter",
              description: "Weekly mental models and AI clarity.",
              linkLabel: "Subscribe",
              linkHref: "/newsletter",
            },
          ],
        } satisfies ContactCardsBlockProps,
      };
    default:
      return createDefaultBlock("rich-text");
  }
}

export const BUILDER_TEMPLATES = {
  landing: {
    label: "Landing page",
    description: "Hero, stats, features, FAQ, and CTA",
    sections: ["hero", "stats", "features", "steps", "faq", "cta"] as PageBlockType[],
  },
  article: {
    label: "Article",
    description: "Header, body, quote, and newsletter",
    sections: ["page-header", "rich-text", "quote", "newsletter"] as PageBlockType[],
  },
  corporate: {
    label: "Corporate offer",
    description: "Hero, proof, team, and contact",
    sections: ["hero", "features", "testimonials", "team", "contact-cards", "cta"] as PageBlockType[],
  },
  workshop: {
    label: "Workshop / event",
    description: "Hero, agenda, video, and signup",
    sections: ["banner", "hero", "agenda", "video", "faq", "form-cta"] as PageBlockType[],
  },
  pricing: {
    label: "Pricing page",
    description: "Header, comparison, plans, FAQ",
    sections: ["page-header", "comparison", "pricing", "faq", "cta"] as PageBlockType[],
  },
} as const;

export type BuilderTemplateId = keyof typeof BUILDER_TEMPLATES;

export function createSectionsFromTemplate(templateId: BuilderTemplateId): PageBlock[] {
  const template = BUILDER_TEMPLATES[templateId] ?? BUILDER_TEMPLATES.landing;
  return template.sections.map((t) => createDefaultBlock(t));
}

export function isKnownBlockType(type: string): type is PageBlockType {
  return BLOCK_DEFINITIONS.some((block) => block.type === type);
}

/** Human-readable catalog for docs / admin help */
export function getComponentCatalog() {
  return BLOCK_DEFINITIONS.map((d) => ({
    type: d.type,
    label: d.label,
    description: d.description,
    aemEquivalent: d.aemEquivalent,
    category: d.category,
  }));
}
