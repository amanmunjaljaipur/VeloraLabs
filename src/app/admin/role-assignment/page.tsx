import { auth } from "@/auth";
import { RoleAssignmentPanel } from "@/components/admin/RoleAssignmentPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Role Assignment",
  description: "Assign user roles across Verlin Labs.",
};

export default async function RoleAssignmentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/role-assignment");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Role Assignment"
        subtitle="Assign roles to users by email. Only Super Admins can access this page."
      />
      <RoleAssignmentPanel currentUserEmail={session.user.email ?? ""} />
    </>
  );
}