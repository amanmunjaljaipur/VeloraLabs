import { LegalCmsPanel } from "@/components/admin/LegalCmsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Legal Policies",
  description: "Manage Terms of Service, Privacy Policy, and Refund Policy for Verlin Labs.",
  path: "/admin/legal",
});

export default async function AdminLegalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/legal");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Legal Policies"
        subtitle="Edit Terms of Service, Privacy Policy, and Refund & Cancellation Policy. Each save bumps the version and may require users to re-accept terms and privacy."
      />
      <LegalCmsPanel />
    </>
  );
}