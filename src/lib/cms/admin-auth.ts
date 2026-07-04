import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";

/** Site CMS and CRM — admin and super_admin. */
export async function requireCmsEditor() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}