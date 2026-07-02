import { PageHeader } from "@/components/layout/PageHeader";
import { getMarkdownPage } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Verlin Labs and our mission for clarity-first learning.",
};

export default async function AboutPage() {
  const { frontmatter, html } = await getMarkdownPage("about.md");

  return (
    <>
      <PageHeader
        title={(frontmatter.title as string) || "About Verlin Labs"}
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