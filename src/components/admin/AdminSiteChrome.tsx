import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";

export async function AdminSiteChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || !isAdminRole(session.user.role)) {
    return <>{children}</>;
  }

  return <AdminLayoutShell role={session.user.role}>{children}</AdminLayoutShell>;
}