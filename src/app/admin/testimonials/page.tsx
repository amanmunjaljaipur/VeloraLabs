import { TestimonialsReview } from "@/components/admin/TestimonialsReview";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Testimonials Review",
  description: "Approve or reject user-submitted testimonials before they go live.",
  path: "/admin/testimonials",
  noIndex: true,
});

export default async function AdminTestimonialsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/testimonials");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Testimonials Review"
        subtitle="Approve or reject testimonials learners submit themselves through LinkedIn or Google sign-in."
      />
      <TestimonialsReview />
    </>
  );
}
