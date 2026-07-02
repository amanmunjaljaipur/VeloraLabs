import { auth } from "@/auth";
import { SessionVideosPanel } from "@/components/admin/SessionVideosPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { isAdminRole } from "@/lib/session-access";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Session Videos",
  description: "Manage YouTube recordings for course sessions.",
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
        title="Session Videos"
        subtitle="Click a session to add or update its YouTube recording. Learners watch videos embedded on the site after signing in."
      />
      <SessionVideosPanel />
    </>
  );
}