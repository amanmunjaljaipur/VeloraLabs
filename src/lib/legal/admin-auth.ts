import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";

export async function requireLegalEditor() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}