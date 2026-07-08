import { auth } from "@/auth";
import { SessionCommentsPanel } from "@/components/admin/SessionCommentsPanel";
import { SessionVideosPanel } from "@/components/admin/SessionVideosPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { isAdminRole } from "@/lib/session-access";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Course Training",
  description: "Manage training videos and documents for course sessions.",
};

export default async function AdminSessionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/sessions");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Course Training"
        subtitle="Add training videos and documents for each lesson, and review learner comments."
      />
      <SessionVideosPanel />
      <SessionCommentsPanel />
    </>
  );
}