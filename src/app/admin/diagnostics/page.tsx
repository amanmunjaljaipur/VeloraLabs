import { auth } from "@/auth";
import { DiagnosticsPanel } from "@/components/admin/DiagnosticsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Diagnostics",
  description: "Critical error and warning logs across Verlin Labs, by page.",
};

export default async function DiagnosticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/diagnostics");
  }

  const isSuperAdmin =
    session.user.role === "super_admin" || isHardcodedSuperAdmin(session.user.email);
  if (!isSuperAdmin) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Diagnostics"
        subtitle="Critical errors and warnings only, grouped by page - kept for about 3 months and never wiped by a deploy."
      />
      <DiagnosticsPanel />
    </>
  );
}
