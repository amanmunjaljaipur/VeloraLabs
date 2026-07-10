import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (isHardcodedSuperAdmin(session.user.email)) return session;
  if (session.user.role !== "super_admin") return null;
  return session;
}
