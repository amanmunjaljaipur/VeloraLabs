import { listCustomCmsPages } from "@/lib/cms/dynamic-pages";

export type CmsContentType = "json" | "markdown" | "rich";

export type CmsEditorLayout = "rich" | "builder";

export interface CmsPageDefinition {
  id: string;
  label: string;
  description: string;
  group: string;
  filename: string;
  type: CmsContentType;
  /** Public route this content powers */
  publicPath?: string;
  /** Visual page builder vs classic rich-text editor */
  editorLayout?: CmsEditorLayout;
}

export const CMS_PAGE_GROUPS = [
  "Global",
  "Pages",
  "Courses",
  "Content",
  "Markdown",
] as const;

export const CMS_PAGES: CmsPageDefinition[] = [
  {
    id: "site",
    label: "Site & Navigation",
    description: "Site name, nav links, footer, newsletter block",
    group: "Global",
    filename: "site.json",
    type: "json",
    publicPath: "/",
  },
  {
    id: "home",
    label: "Homepage",
    description: "Hero, how-it-works, home FAQs, illustrations",
    group: "Pages",
    filename: "home-content.json",
    type: "json",
    publicPath: "/",
  },
  {
    id: "audiences",
    label: "Audience Tracks",
    description: "Student, engineer, and PM landing cards",
    group: "Pages",
    filename: "audiences.json",
    type: "json",
    publicPath: "/programs",
  },
  {
    id: "free-session",
    label: "Free Session",
    description: "Headline, agenda, benefits, FAQs",
    group: "Pages",
    filename: "free-session.json",
    type: "json",
    publicPath: "/free-session",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Learner quotes across the site",
    group: "Pages",
    filename: "testimonials.json",
    type: "json",
    publicPath: "/testimonials",
  },
  {
    id: "trainer",
    label: "Trainer Profile",
    description: "About page instructor bio and credentials",
    group: "Pages",
    filename: "trainer.json",
    type: "json",
    publicPath: "/about",
  },
  {
    id: "trust-signals",
    label: "Trust Signals",
    description: "Homepage trust section and citations",
    group: "Pages",
    filename: "trust-signals.json",
    type: "json",
    publicPath: "/",
  },
  {
    id: "faq",
    label: "Site FAQ",
    description: "Full FAQ hub categories and answers",
    group: "Pages",
    filename: "faq-content.json",
    type: "json",
    publicPath: "/faq",
  },
  {
    id: "courses-students",
    label: "Course - Students",
    description: "Student track curriculum and pricing",
    group: "Courses",
    filename: "courses-students.json",
    type: "json",
    publicPath: "/courses/students",
  },
  {
    id: "courses-engineers",
    label: "Course - Engineers",
    description: "Engineer track curriculum and pricing",
    group: "Courses",
    filename: "courses-engineers.json",
    type: "json",
    publicPath: "/courses/engineers",
  },
  {
    id: "courses-professionals",
    label: "Course - Product Managers",
    description: "PM track curriculum and pricing",
    group: "Courses",
    filename: "courses.json",
    type: "json",
    publicPath: "/courses/professionals",
  },
  {
    id: "library",
    label: "Library Articles",
    description: "Blog and library long-form content",
    group: "Content",
    filename: "library.json",
    type: "json",
    publicPath: "/library",
  },
  {
    id: "mental-models",
    label: "Mental Models",
    description: "Mental model articles and frameworks",
    group: "Content",
    filename: "mental-models.json",
    type: "json",
    publicPath: "/mental-models",
  },
  {
    id: "about",
    label: "About Page",
    description: "Markdown body and frontmatter",
    group: "Markdown",
    filename: "about.md",
    type: "markdown",
    publicPath: "/about",
  },
  {
    id: "resources",
    label: "Resources Hub",
    description: "Resources landing markdown",
    group: "Markdown",
    filename: "resources.md",
    type: "markdown",
    publicPath: "/resources",
  },
  {
    id: "resource-workbook",
    label: "Resource - Workbook",
    description: "Free session workbook download",
    group: "Markdown",
    filename: "resource-free-session-workbook.md",
    type: "markdown",
    publicPath: "/resources/free-session-workbook",
  },
  {
    id: "resource-cheat-sheet",
    label: "Resource - Cheat Sheet",
    description: "Mental models cheat sheet",
    group: "Markdown",
    filename: "resource-mental-models-cheat-sheet.md",
    type: "markdown",
    publicPath: "/resources/mental-models-cheat-sheet",
  },
  {
    id: "resource-glossary",
    label: "Resource - AI Glossary",
    description: "AI glossary download",
    group: "Markdown",
    filename: "resource-ai-glossary.md",
    type: "markdown",
    publicPath: "/resources/ai-glossary",
  },
];

export function getAllCmsPages(): CmsPageDefinition[] {
  return [...CMS_PAGES, ...listCustomCmsPages()];
}

export function getCmsPage(id: string): CmsPageDefinition | undefined {
  return getAllCmsPages().find((page) => page.id === id);
}