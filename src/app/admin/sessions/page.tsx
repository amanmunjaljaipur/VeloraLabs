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
        subtitle="Manage recordings by program and module — the same structure as Programs. Select a track, open a lesson, and paste the YouTube link."
      />
      <SessionVideosPanel />
    </>
  );
}