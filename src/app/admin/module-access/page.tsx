import { auth } from "@/auth";
import { ModuleAccessPanel } from "@/components/admin/ModuleAccessPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { isAdminRole } from "@/lib/session-access";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Course Access",
  description: "Grant learners access to full programs or selected course modules.",
};

export default async function ModuleAccessPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/module-access");
  }

  const role = session.user.role;
  if (!role || !isAdminRole(role)) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Course Access"
        subtitle="Add learners by email and control whether they get the full program or only specific modules."
      />
      <ModuleAccessPanel />
    </>
  );
}