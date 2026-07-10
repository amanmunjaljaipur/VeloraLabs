import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isAdminRole } from "@/lib/session-access";

export async function requireLegalEditor() {
  const session = await auth();
  if (!session?.user) return null;
  if (isHardcodedSuperAdmin(session.user.email)) return session;
  if (!isAdminRole(session.user.role)) return null;
  return session;
}
