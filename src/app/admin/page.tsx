import { AdminHomeDashboard } from "@/components/dashboard/AdminHomeDashboard";
import { auth } from "@/auth";
import { getRoleForEmailFresh, isHardcodedSuperAdmin } from "@/lib/roles";
import { createMetadata } from "@/lib/seo";
import type { UserRole } from "@/types/roles";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Admin Overview",
  description: "Verlin Labs admin dashboard - analytics, CMS, CRM, roles, and more.",
  path: "/admin",
});

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  let role: UserRole | null = session.user.role ?? null;
  if ((!role || (role !== "admin" && role !== "super_admin")) && session.user.email) {
    if (isHardcodedSuperAdmin(session.user.email)) {
      role = "super_admin";
    } else {
      role = await getRoleForEmailFresh(session.user.email);
    }
  }

  if (!role || (role !== "admin" && role !== "super_admin")) {
    // Soft landing: do not bounce owners to login if role still resolving
    if (isHardcodedSuperAdmin(session.user.email)) {
      role = "super_admin";
    } else {
      redirect("/");
    }
  }

  return (
    <AdminHomeDashboard
      userName={session.user.name}
      role={role}
      email={session.user.email}
    />
  );
}
