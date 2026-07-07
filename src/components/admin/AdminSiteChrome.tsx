import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";

export async function AdminSiteChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const role = session?.user?.role;
  if (!role || !isAdminRole(role)) {
    return <>{children}</>;
  }

  return <AdminLayoutShell role={role}>{children}</AdminLayoutShell>;
}