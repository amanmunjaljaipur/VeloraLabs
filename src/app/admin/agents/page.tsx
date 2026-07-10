import { AgentsControlPanel } from "@/components/admin/AgentsControlPanel";
import { auth } from "@/auth";
import { isSuperAdminRole } from "@/lib/session-access";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Agents",
  description: "Super Admin control of all AI and product agents across Verlin Labs.",
  path: "/admin/agents",
  noIndex: true,
});

export default async function AdminAgentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/agents");
  }
  if (!isSuperAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return <AgentsControlPanel />;
}
