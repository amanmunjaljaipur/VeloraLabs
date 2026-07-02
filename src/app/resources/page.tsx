import { PageHeader } from "@/components/layout/PageHeader";
import { getMarkdownPage } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description: "Curated tools and references for clarity-first learners.",
};

export default async function ResourcesPage() {
  const { frontmatter, html } = await getMarkdownPage("resources.md");

  return (
    <>
      <PageHeader
        title={(frontmatter.title as string) || "Resources"}
        subtitle={frontmatter.subtitle as string}
      />
      <section className="pb-16 md:pb-24">
        <div
          className="prose-verlin mx-auto max-w-3xl px-4 md:px-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </>
  );
}