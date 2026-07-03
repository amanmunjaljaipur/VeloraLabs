import { PageHeader } from "@/components/layout/PageHeader";
import { TrainerProfile } from "@/components/sections/TrainerProfile";
import { getLeadTrainer, getMarkdownPage } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Verlin Labs and our mission for clarity-first learning.",
};

export default async function AboutPage() {
  const { frontmatter, html } = await getMarkdownPage("about.md");
  const trainer = getLeadTrainer();

  return (
    <>
      <PageHeader
        eyebrow="Our mission"
        title={(frontmatter.title as string) || "About Verlin Labs"}
        subtitle={frontmatter.subtitle as string}
        align="center"
        compact
      />
      <section className="section-y">
        <div
          className="prose-verlin mx-auto max-w-3xl px-4 md:px-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
      <TrainerProfile trainer={trainer} />
    </>
  );
}