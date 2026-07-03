import { auth } from "@/auth";
import { AdminHomeDashboard } from "@/components/dashboard/AdminHomeDashboard";
import { LearnerHomeDashboard } from "@/components/dashboard/LearnerHomeDashboard";
import { MarketingHome } from "@/components/home/MarketingHome";
import { buildLearnerDashboard } from "@/lib/learner-dashboard";
import { ensureRolesLoaded, hasCustomRoleAssignment } from "@/lib/roles";
import { isAdminRole, isLearnerRole } from "@/lib/session-access";

export default async function HomePage() {
  const session = await auth();
  await ensureRolesLoaded();

  if (session?.user) {
    const { role, email, name } = session.user;

    if (isAdminRole(role)) {
      return <AdminHomeDashboard userName={name} role={role} />;
    }

    if (hasCustomRoleAssignment(email) && isLearnerRole(role)) {
      const dashboard = buildLearnerDashboard(email ?? "", role);
      if (dashboard) {
        return <LearnerHomeDashboard userName={name} role={role} data={dashboard} />;
      }
    }
  }

  return <MarketingHome />;
}