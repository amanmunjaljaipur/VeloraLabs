import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { getCourses } from "@/lib/content";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses & Programs",
  description: "The full 8-week Velora Labs program — from mental models to mastery.",
};

export default function CoursesPage() {
  const courses = getCourses();

  const curriculumItems = courses.curriculum.map((section) => ({
    question: section.title,
    answer: section.topics.map((t) => `• ${t}`).join("\n"),
  }));

  return (
    <>
      <PageHeader title={courses.title} subtitle={courses.subtitle}>
        <p className="text-text-secondary leading-relaxed max-w-2xl">{courses.description}</p>
      </PageHeader>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8">Curriculum</h2>
          <Accordion items={curriculumItems} />
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">Who it&apos;s for</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {courses.audiences.map((a) => (
              <Card key={a.slug} hover>
                <h3 className="font-semibold capitalize text-foreground">
                  {a.slug === "students" ? "School Students" : a.slug === "engineers" ? "College Engineers" : "Professionals"}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">{a.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="enroll" className="py-16 md:py-24">
        <div className="mx-auto max-w-lg px-4 md:px-8 text-center">
          <Card className="border-teal ring-2 ring-teal/10">
            <p className="text-sm font-medium text-teal uppercase tracking-wider">Full Program</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{courses.price}</p>
            <p className="mt-2 text-text-secondary">{courses.duration}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/free-session">
                <Button size="lg" className="w-full">Book Free Session First</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="w-full">Enroll Now — Contact Us</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}