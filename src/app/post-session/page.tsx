import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getCourses, getTestimonials } from "@/lib/content";
import { Check } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continue Your Journey",
  description: "See how the full Verlin Labs program builds on your free session experience.",
};

export default async function PostSessionPage() {
  const courses = getCourses();
  const testimonials = getTestimonials().slice(0, 3);
  const session = await auth();
  const isEnrolled = session?.user
    ? isEnrolledLearner(session.user.email, session.user.role)
    : false;

  return (
    <>
      <PageHeader
        title="Thank you for attending!"
        subtitle="You experienced clarity-first learning. Here is how the full program takes you further."
      />

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <h3 className="text-xl font-semibold mb-6">{courses.comparison.free.title}</h3>
              <ul className="space-y-4">
                {courses.comparison.free.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                    <Check className="h-5 w-5 shrink-0 text-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-teal ring-2 ring-teal/10">
              <div className="mb-2 inline-flex rounded-lg bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                Recommended
              </div>
              <h3 className="text-xl font-semibold mb-6">{courses.comparison.paid.title}</h3>
              <ul className="space-y-4">
                {courses.comparison.paid.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="h-5 w-5 shrink-0 text-accent-teal" />
                    {item}
                  </li>
                ))}
              </ul>
              {!isEnrolled && (
                <div className="mt-8">
                  <CoursePrice price={courses.price} size="md" />
                  <p className="text-sm text-text-secondary mt-1">{courses.duration}</p>
                  <Link href="/courses#enroll" className="block mt-6">
                    <Button className="w-full" size="lg">Enroll in a Course</Button>
                  </Link>
                </div>
              )}
              {isEnrolled && (
                <div className="mt-8">
                  <p className="text-sm text-text-secondary">You&apos;re already enrolled in your program.</p>
                  <Link href="/" className="block mt-6">
                    <Button className="w-full" size="lg">Go to your dashboard</Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold text-center mb-12">
            From free session to full mastery
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}