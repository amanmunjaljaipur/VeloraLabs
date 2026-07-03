import { auth } from "@/auth";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }
  return session;
}