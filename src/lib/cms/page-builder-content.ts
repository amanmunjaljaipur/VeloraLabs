import { createSectionsFromTemplate, type BuilderTemplateId } from "@/lib/cms/block-registry";
import type { BuilderPageContent, PageBlock } from "@/lib/cms/page-builder-types";
import { readCmsJson, writeCmsJson } from "@/lib/cms/store";

export const DEFAULT_BUILDER_PAGE: BuilderPageContent = {
  title: "",
  subtitle: "",
  seoDescription: "",
  layout: "builder",
  status: "draft",
  sections: [],
  publishedSections: [],
};

export function readBuilderPageContent(filename: string): BuilderPageContent {
  const data = readCmsJson<Partial<BuilderPageContent>>(filename);
  return {
    ...DEFAULT_BUILDER_PAGE,
    ...data,
    layout: "builder",
    sections: data.sections ?? [],
    publishedSections: data.publishedSections ?? [],
  };
}

export function writeBuilderPageContent(filename: string, content: BuilderPageContent): void {
  writeCmsJson(filename, { ...content, layout: "builder" });
}

export function seedBuilderPageContent(input: {
  title: string;
  subtitle: string;
  templateId?: BuilderTemplateId;
}): BuilderPageContent {
  const sections = input.templateId
    ? createSectionsFromTemplate(input.templateId)
    : createSectionsFromTemplate("custom");

  return {
    title: input.title,
    subtitle: input.subtitle,
    seoDescription: input.subtitle,
    layout: "builder",
    status: "draft",
    sections,
    publishedSections: [],
  };
}

export function publishBuilderPage(content: BuilderPageContent): BuilderPageContent {
  return {
    ...content,
    status: "published",
    publishedSections: structuredClone(content.sections),
  };
}

/** Only published sections reach the public site — drafts stay in the design studio. */
export function getLiveBuilderSections(content: BuilderPageContent): PageBlock[] {
  if (content.status === "published") {
    return content.publishedSections.length > 0
      ? content.publishedSections
      : content.sections;
  }
  return [];
}

export function getPreviewBuilderSections(content: BuilderPageContent): PageBlock[] {
  return content.sections.length > 0 ? content.sections : content.publishedSections;
}