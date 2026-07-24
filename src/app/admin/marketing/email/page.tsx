import { EmailSuite } from "@/components/admin/EmailSuite";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = createMetadata({
  title: "Email Suite",
  description: "Inbox with AI triage, lead capture, and campaign sends - the Marketing Board's 5th channel.",
  path: "/admin/marketing/email",
  noIndex: true,
});

export default async function AdminMarketingEmailPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/marketing/email");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Email Suite"
        subtitle="Read and triage your inbox with AI, track leads, and send compliant campaigns - without leaving the Marketing Board."
      />
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl bg-muted" />}>
        <EmailSuite />
      </Suspense>
    </>
  );
}
