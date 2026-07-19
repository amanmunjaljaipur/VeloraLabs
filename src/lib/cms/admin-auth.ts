import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isAdminRole } from "@/lib/session-access";

/** Site CMS and CRM - admin and super_admin. */
export async function requireCmsEditor() {
  const session = await auth();
  if (!session?.user) return null;
  if (isHardcodedSuperAdmin(session.user.email)) return session;
  if (!isAdminRole(session.user.role)) return null;
  return session;
}
