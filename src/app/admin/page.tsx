import { AdminHomeDashboard } from "@/components/dashboard/AdminHomeDashboard";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Admin Overview",
  description: "Verlin Labs admin dashboard — analytics, CMS, CRM, roles, and more.",
  path: "/admin",
});

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <AdminHomeDashboard
      userName={session.user.name}
      role={session.user.role}
    />
  );
}