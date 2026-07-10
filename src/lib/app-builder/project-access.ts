import type { AppProject } from "@/lib/app-builder/types";
import { isSuperAdminRole } from "@/lib/session-access";

/**
 * Platform App Builder project access.
 * Super admin: all projects. Other CMS editors: only projects they created.
 */
export function canAccessAppProject(
  project: AppProject,
  session: { user?: { email?: string | null; role?: string | null } } | null
): boolean {
  if (!session?.user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isSuperAdminRole(session.user.role as any)) return true;
  const email = session.user.email?.toLowerCase().trim();
  if (!email) return false;
  const owner = project.createdBy?.toLowerCase().trim();
  // Legacy projects without createdBy: only super_admin (avoid leaking all shops to every admin)
  if (!owner) return false;
  return owner === email;
}

export function filterAccessibleProjects(
  projects: AppProject[],
  session: { user?: { email?: string | null; role?: string | null } } | null
): AppProject[] {
  if (!session?.user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isSuperAdminRole(session.user.role as any)) return projects;
  return projects.filter((p) => canAccessAppProject(p, session));
}
