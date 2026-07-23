import { MarketingBoard } from "@/components/admin/MarketingBoard";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = createMetadata({
  title: "Marketing Board",
  description: "Post to Instagram, Facebook, and LinkedIn from one screen and see performance.",
  path: "/admin/marketing",
  noIndex: true,
});

export default async function AdminMarketingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/marketing");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Marketing Board"
        subtitle="Connect Instagram, Facebook, and LinkedIn once, publish to all three from one composer, and see how each post is doing in one place."
      />
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl bg-muted" />}>
        <MarketingBoard />
      </Suspense>
    </>
  );
}
