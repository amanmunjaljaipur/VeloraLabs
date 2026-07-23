import {
  getAllCourseTracks,
  getLibraryItems,
  getMentalModels,
  getResourceDownloadSlugs,
} from "@/lib/content";
import { listCustomCmsPages } from "@/lib/cms/dynamic-pages";
import { getLiveBuilderSections, readBuilderPageContent } from "@/lib/cms/page-builder-content";
import { isBuilderPageContent } from "@/lib/cms/page-builder-types";
import { readRichPageContent } from "@/lib/cms/rich-content";
import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

export { SITE_ORIGIN };

export type SitemapSectionId = "programs" | "learn" | "company" | "legal" | "account";

export interface SitemapPage {
  href: string;
  label: string;
  title: string;
  description: string;
  section: SitemapSectionId;
  inHeader?: boolean;
  inFooter?: boolean;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  /**
   * Groups an inHeader page under a header dropdown ("Products" or "Learn")
   * instead of rendering it as a flat top-level link - keeps Product
   * Offerings visually separated from Learning Content in the nav.
   */
  navGroup?: "products" | "learn";
}

export interface SitemapSection {
  id: SitemapSectionId;
  title: string;
  links: SitemapPage[];
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

const COURSE_TRACK_LABELS: Record<string, string> = {
  students: "School Students Program",
  engineers: "College Engineers Program",
  professionals: "Product Managers Program",
};

/** Canonical site map - single source of truth for nav, footer, HTML sitemap, and XML sitemap. */
const STATIC_PAGES: SitemapPage[] = [
  {
    href: "/",
    label: "Home",
    title: "Verlin Labs",
    description: "Clarity-first AI learning through mental models, live sessions, and hands-on programs.",
    section: "programs",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    href: "/free-session",
    label: "Free Session",
    title: "Free 2-Hour Session",
    description: "Book a free introductory session and experience clarity-first AI learning live.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    href: "/docs",
    label: "Docs",
    title: "Developer Docs",
    description: "Public API, sample dataset, and integration guide for developers and enterprises.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    href: "/demo",
    label: "Try It",
    title: "Try It - Interactive Demo",
    description: "Pick a topic and see a live mental-model breakdown - no signup required.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    href: "/pricing",
    label: "Pricing",
    title: "Pricing",
    description:
      "Transparent pricing - a free trial session, per-track pricing for students, engineers, and PMs, and custom enterprise plans.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    href: "/products",
    label: "Products",
    title: "Product Catalog",
    description:
      "Packaged offerings - AI literacy courses, PM and engineer toolkits, student bundles, and corporate workshops.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    href: "/programs",
    label: "Programs",
    title: "Programs & Offerings",
    description:
      "Explore Verlin Labs programs - free session, paid learning tracks for students, engineers, and product managers, plus corporate workshops.",
    section: "programs",
    inFooter: true,
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    href: "/courses",
    label: "Courses",
    title: "Courses",
    description:
      "Clarity-first learning courses for school students, college engineers, and product managers.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    href: "/ai-for-students",
    label: "AI for Students",
    title: "AI for School Students",
    description:
      "Dedicated landing page for Classes 6–12 - mental models, safe AI tool use, and live sessions at Verlin Labs.",
    section: "programs",
    inFooter: true,
    priority: 0.82,
    changeFrequency: "monthly",
  },
  {
    href: "/courses/students",
    label: "School Students",
    title: "AI Program for School Students",
    description: "Hands-on AI learning for Classes 6–12 with mental models and live sessions.",
    section: "programs",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    href: "/ai-for-engineers",
    label: "AI for Engineers",
    title: "AI for College Engineers",
    description:
      "Dedicated landing page for college engineers - LLM fundamentals, portfolio projects, and interview prep.",
    section: "programs",
    inFooter: true,
    priority: 0.82,
    changeFrequency: "monthly",
  },
  {
    href: "/courses/engineers",
    label: "College Engineers",
    title: "AI Program for College Engineers",
    description: "Build intuition for modern AI systems - from theory to responsible practice.",
    section: "programs",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    href: "/ai-for-pms",
    label: "AI for PMs",
    title: "AI for Product Managers",
    description:
      "Dedicated landing page for product managers - evaluate AI tools, ship MVPs, and lead teams with clarity.",
    section: "programs",
    inFooter: true,
    priority: 0.82,
    changeFrequency: "monthly",
  },
  {
    href: "/courses/professionals",
    label: "Product Managers",
    title: "AI Training for Product Managers",
    description:
      "AI training for product managers - evaluate tools, ship AI-powered MVPs, and lead teams with clarity at Verlin Labs.",
    section: "programs",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    href: "/corporate",
    label: "Corporate Workshops",
    title: "Corporate & Team Workshops",
    description: "Clarity-first AI literacy workshops tailored for teams and organizations.",
    section: "programs",
    inHeader: true,
    inFooter: true,
    navGroup: "products",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    href: "/library",
    label: "Library",
    title: "Library",
    description: "Articles, guides, and workshops on AI and technology - organized for clarity.",
    section: "learn",
    inHeader: true,
    inFooter: true,
    navGroup: "learn",
    priority: 0.7,
    changeFrequency: "weekly",
  },
  {
    href: "/blog",
    label: "Blog",
    title: "Blog",
    description: "Practical notes and updates from the Verlin Labs team.",
    section: "learn",
    inHeader: true,
    inFooter: true,
    navGroup: "learn",
    priority: 0.65,
    changeFrequency: "weekly",
  },
  {
    href: "/learn/llms-for-product-discovery",
    label: "LLMs for PM Discovery",
    title: "How to Use LLMs for Product Discovery",
    description:
      "Long-tail hub for PMs - LLM workflows for discovery, synthesis, and PRDs linked to Verlin Labs courses.",
    section: "learn",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    href: "/learn/ai-roadmap-for-non-technical-pms",
    label: "AI Roadmap for PMs",
    title: "AI Roadmap for Non-Technical PMs",
    description:
      "Question-based hub - AI literacy and MVP roadmap for product managers without a CS background.",
    section: "learn",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    href: "/learn/ai-for-school-students",
    label: "AI for School Students",
    title: "AI Learning Roadmap for Students",
    description:
      "Hub for Classes 6–12 - safe AI learning, mental models, and links to the Verlin Labs student program.",
    section: "learn",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    href: "/mental-models",
    label: "Mental Models",
    title: "Mental Models",
    description: "Core frameworks for understanding AI and complex technology without jargon.",
    section: "learn",
    inHeader: true,
    inFooter: true,
    navGroup: "learn",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    href: "/resources",
    label: "Resources Hub",
    title: "Resources Hub",
    description: "Library, blog, mental models, downloads, and curated tools for clarity-first learners.",
    section: "learn",
    inHeader: true,
    inFooter: true,
    navGroup: "learn",
    priority: 0.65,
    changeFrequency: "monthly",
  },
  {
    href: "/newsletter",
    label: "Newsletter",
    title: "Newsletter",
    description: "Weekly mental models, frameworks, and clarity-first insights - no noise.",
    section: "learn",
    inFooter: true,
    priority: 0.6,
    changeFrequency: "weekly",
  },
  {
    href: "/newsletter/weekly",
    label: "Weekly Newsletter",
    title: "Weekly Newsletter",
    description: "Verlin Labs weekly clarity-first AI and technology roundup.",
    section: "learn",
    priority: 0.55,
    changeFrequency: "weekly",
  },
  {
    href: "/newsletter/archive",
    label: "Newsletter Archive",
    title: "Newsletter Archive",
    description: "Browse every published Verlin Labs weekly newsletter edition.",
    section: "learn",
    priority: 0.5,
    changeFrequency: "weekly",
  },
  {
    href: "/about",
    label: "About",
    title: "About Verlin Labs",
    description:
      "Founded by Aman Munjal - clarity-first AI education through mental models and live learning.",
    section: "company",
    inHeader: true,
    inFooter: true,
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    href: "/faq",
    label: "FAQ",
    title: "FAQ",
    description: "Answers about free sessions, programs, learning experience, teams, and logistics.",
    section: "company",
    inHeader: true,
    inFooter: true,
    priority: 0.65,
    changeFrequency: "monthly",
  },
  {
    href: "/contact",
    label: "Contact",
    title: "Contact",
    description: "Reach Verlin Labs for sessions, corporate programs, partnerships, and questions.",
    section: "company",
    inHeader: true,
    inFooter: true,
    priority: 0.65,
    changeFrequency: "monthly",
  },
  {
    href: "/testimonials",
    label: "Testimonials",
    title: "Testimonials",
    description:
      "What students, engineers, product managers, and parents say about learning with Verlin Labs.",
    section: "company",
    inFooter: true,
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    href: "/case-studies",
    label: "Case Studies",
    title: "Case Studies",
    description:
      "Real learner stories - how mental-model training changed the way students, engineers, and PMs think about AI.",
    section: "company",
    inHeader: true,
    inFooter: true,
    navGroup: "learn",
    priority: 0.65,
    changeFrequency: "monthly",
  },
  {
    href: "/terms",
    label: "Terms of Service",
    title: "Terms of Service",
    description: "Terms governing use of Verlin Labs website, sessions, and paid programs.",
    section: "legal",
    inFooter: true,
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    description: "How Verlin Labs collects, uses, and protects your personal information.",
    section: "legal",
    inFooter: true,
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    href: "/refund-policy",
    label: "Refund Policy",
    title: "Refund & Cancellation Policy",
    description: "Refund, cancellation, and rescheduling terms for sessions and paid programs.",
    section: "legal",
    inFooter: true,
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    href: "/sitemap",
    label: "Sitemap",
    title: "Sitemap",
    description: "Browse all main pages on Verlin Labs.",
    section: "legal",
    inFooter: true,
    priority: 0.2,
    changeFrequency: "monthly",
  },
  {
    href: "/login",
    label: "Sign in",
    title: "Sign in",
    description: "Sign in to your Verlin Labs account.",
    section: "account",
    priority: 0.2,
  },
  {
    href: "/signup",
    label: "Create account",
    title: "Create account",
    description: "Create your Verlin Labs learner account.",
    section: "account",
    priority: 0.2,
  },
];

const FOOTER_SECTION_ORDER: { id: SitemapSectionId; title: string }[] = [
  { id: "programs", title: "Programs" },
  { id: "learn", title: "Learn" },
  { id: "company", title: "Company" },
  { id: "legal", title: "Legal" },
];

const HTML_SITEMAP_SECTIONS: SitemapSectionId[] = [
  "programs",
  "learn",
  "company",
  "account",
  "legal",
];

const HTML_SITEMAP_SECTION_TITLES: Record<SitemapSectionId, string> = {
  programs: "Programs",
  learn: "Learn",
  company: "Company",
  legal: "Legal",
  account: "Account",
};

function courseTrackPages(): SitemapPage[] {
  return getAllCourseTracks().map(({ slug, course }) => ({
    href: `/courses/${slug}`,
    label: COURSE_TRACK_LABELS[slug] ?? course.title,
    title: course.title,
    description: course.description,
    section: "programs" as const,
    inFooter: true,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));
}

function libraryPages(): SitemapPage[] {
  return getLibraryItems().map((item) => ({
    href: `/library/${item.slug}`,
    label: item.title,
    title: item.title,
    description: item.description ?? item.summary,
    section: "learn" as const,
    priority: 0.55,
    changeFrequency: "monthly" as const,
  }));
}

function mentalModelPages(): SitemapPage[] {
  return getMentalModels().map((model) => ({
    href: `/mental-models/${model.slug}`,
    label: model.name,
    title: model.name,
    description: model.shortDescription,
    section: "learn" as const,
    priority: 0.55,
    changeFrequency: "monthly" as const,
  }));
}

function resourceDownloadPages(): SitemapPage[] {
  return getResourceDownloadSlugs().map((slug) => ({
    href: `/resources/${slug}`,
    label: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    title: slug,
    description: "Verlin Labs learner download and reference.",
    section: "learn" as const,
    priority: 0.5,
    changeFrequency: "yearly" as const,
  }));
}

/** Published design-studio / custom CMS pages for XML + HTML sitemaps */
function customCmsPublicPages(): SitemapPage[] {
  return listCustomCmsPages()
    .filter((page) => Boolean(page.publicPath))
    .flatMap((page) => {
      try {
        if (page.editorLayout === "builder") {
          const content = readBuilderPageContent(page.filename);
          if (content.status !== "published" || getLiveBuilderSections(content).length === 0) {
            return [];
          }
          return [
            {
              href: page.publicPath!,
              label: content.title || page.label,
              title: content.title || page.label,
              description: content.seoDescription || content.subtitle || page.description,
              section: "company" as const,
              priority: 0.55,
              changeFrequency: "weekly" as const,
            },
          ];
        }

        const stored = readRichPageContent(page.filename);
        if (isBuilderPageContent(stored)) {
          if (stored.status !== "published" || getLiveBuilderSections(stored).length === 0) {
            return [];
          }
        }

        return [
          {
            href: page.publicPath!,
            label: page.label,
            title: ("title" in stored && stored.title) || page.label,
            description:
              ("seoDescription" in stored && stored.seoDescription) ||
              page.description,
            section: "company" as const,
            priority: 0.55,
            changeFrequency: "weekly" as const,
          },
        ];
      } catch {
        return [];
      }
    });
}

let cachedPages: SitemapPage[] | null = null;

export function getAllSitemapPages(): SitemapPage[] {
  const pageMap = new Map<string, SitemapPage>();

  if (cachedPages) {
    for (const page of cachedPages) {
      pageMap.set(page.href, page);
    }
  } else {
    for (const page of STATIC_PAGES) {
      pageMap.set(page.href, page);
    }
    for (const page of courseTrackPages()) {
      pageMap.set(page.href, page);
    }
    for (const page of [...libraryPages(), ...mentalModelPages(), ...resourceDownloadPages()]) {
      if (!pageMap.has(page.href)) {
        pageMap.set(page.href, page);
      }
    }
    cachedPages = [...pageMap.values()];
  }

  for (const page of customCmsPublicPages()) {
    if (!pageMap.has(page.href)) {
      pageMap.set(page.href, page);
    }
  }

  return [...pageMap.values()];
}

export function getSitemapPage(href: string): SitemapPage | undefined {
  return getAllSitemapPages().find((page) => page.href === href);
}

export interface HeaderNavLink {
  label: string;
  href: string;
  navGroup?: "products" | "learn";
}

export function getHeaderNavLinks(): HeaderNavLink[] {
  return getAllSitemapPages()
    .filter((page) => page.inHeader)
    .map(({ label, href, navGroup }) => ({ label, href, navGroup }));
}

export function buildFooterLinkGroups(): FooterLinkGroup[] {
  const pages = getAllSitemapPages().filter((page) => page.inFooter);
  const pageMap = new Map(pages.map((page) => [page.href, page]));

  const programsOrder = [
    "/free-session",
    "/programs",
    "/courses",
    "/ai-for-students",
    "/ai-for-engineers",
    "/ai-for-pms",
    "/courses/students",
    "/courses/engineers",
    "/courses/professionals",
    "/corporate",
  ];
  const learnOrder = [
    "/library",
    "/blog",
    "/mental-models",
    "/resources",
    "/newsletter",
    "/newsletter/archive",
  ];
  const companyOrder = ["/about", "/testimonials", "/faq", "/contact"];
  const legalOrder = ["/terms", "/privacy", "/refund-policy", "/sitemap"];

  const orderBySection: Record<SitemapSectionId, string[]> = {
    programs: programsOrder,
    learn: learnOrder,
    company: companyOrder,
    legal: legalOrder,
    account: [],
  };

  return FOOTER_SECTION_ORDER.map(({ id, title }) => ({
    title,
    links: orderBySection[id]
      .map((href) => pageMap.get(href))
      .filter((page): page is SitemapPage => Boolean(page))
      .map(({ label, href }) => ({ label, href })),
  })).filter((group) => group.links.length > 0);
}

export function buildSitemapSections(): SitemapSection[] {
  const pages = getAllSitemapPages();
  const accountPages = pages.filter((page) => page.section === "account");

  return HTML_SITEMAP_SECTIONS.map((id) => {
    const sectionPages =
      id === "account"
        ? accountPages
        : pages.filter((page) => page.section === id && page.href !== "/");

    const order =
      id === "programs"
        ? ["/free-session", "/programs", "/courses", "/ai-for-students", "/ai-for-engineers", "/ai-for-pms", "/courses/students", "/courses/engineers", "/courses/professionals", "/corporate"]
        : id === "learn"
          ? ["/library", "/blog", "/mental-models", "/resources", "/newsletter", "/newsletter/archive"]
          : id === "company"
            ? ["/about", "/testimonials", "/faq", "/contact"]
            : id === "legal"
              ? ["/terms", "/privacy", "/refund-policy"]
              : [];

    const pageMap = new Map(sectionPages.map((page) => [page.href, page]));
    const ordered = order
      .map((href) => pageMap.get(href))
      .filter((page): page is SitemapPage => Boolean(page));
    const remainder = sectionPages.filter((page) => !order.includes(page.href));

    return {
      id,
      title: HTML_SITEMAP_SECTION_TITLES[id],
      links: [...ordered, ...remainder],
    };
  }).filter((section) => section.links.length > 0);
}

export function getSitemapSectionLinks(
  section: SitemapSectionId,
  excludeHref?: string
): SitemapPage[] {
  return getAllSitemapPages().filter(
    (page) => page.section === section && page.href !== excludeHref && page.href !== "/"
  );
}

const EXCLUDED_XML_PREFIXES = ["/admin", "/api", "/sessions", "/my-course", "/login", "/signup"];

export function getXmlSitemapEntries(): MetadataRoute.Sitemap {
  return getAllSitemapPages()
    .filter((page) => !EXCLUDED_XML_PREFIXES.some((prefix) => page.href.startsWith(prefix)))
    .map((page) => ({
      url: `${SITE_ORIGIN}${page.href === "/" ? "/" : page.href}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency ?? "monthly",
      priority: page.priority ?? 0.5,
    }));
}