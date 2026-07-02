import { auth } from "@/auth";
import { RoleAssignmentPanel } from "@/components/admin/RoleAssignmentPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { isAdminRole } from "@/lib/session-access";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Assign user roles across Verlin Labs.",
};

export default async function RoleAssignmentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/role-assignment");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }

  const isSuperAdmin = session.user.role === "super_admin";

  return (
    <>
      <PageHeader
        title="Admin Panel"
        subtitle={
          isSuperAdmin
            ? "Review users without roles, assign in bulk, or manage existing assignments."
            : "Assign Student, Engineer, or Professional roles to users by email."
        }
      />
      <RoleAssignmentPanel
        currentUserEmail={session.user.email ?? ""}
        actorRole={session.user.role}
      />
    </>
  );
}