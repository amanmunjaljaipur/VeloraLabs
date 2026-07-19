import { NewsletterStudio } from "@/components/admin/NewsletterStudio";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Newsletter Studio",
  description: "Create and send Verlin Labs AI newsletters.",
};

export default async function AdminNewsletterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/newsletter");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const siteUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "https://velora-labs-gamma.vercel.app";
  const mcpUrl = `${siteUrl.replace(/\/$/, "")}/api/mcp/newsletter`;

  return (
    <>
      <PageHeader
        title="Newsletter Studio"
        subtitle="Create a clarity-first AI digest from the latest internet news, preview it, and send whenever you are ready."
      />
      <NewsletterStudio mcpUrl={mcpUrl} />
    </>
  );
}