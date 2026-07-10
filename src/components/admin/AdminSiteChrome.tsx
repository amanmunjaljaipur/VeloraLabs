import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isAdminRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export async function AdminSiteChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const email = session?.user?.email;
  let role = session?.user?.role as UserRole | null | undefined;
  if ((!role || !isAdminRole(role)) && isHardcodedSuperAdmin(email)) {
    role = "super_admin";
  }
  if (!role || !isAdminRole(role)) {
    return <>{children}</>;
  }

  return <AdminLayoutShell role={role}>{children}</AdminLayoutShell>;
}