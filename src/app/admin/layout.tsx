import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/sessions");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }

  return <AdminLayoutShell role={session.user.role}>{children}</AdminLayoutShell>;
}