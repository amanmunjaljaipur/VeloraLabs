import { SlotsManager } from "@/components/admin/SlotsManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Session Slots",
  description: "Manage bookable session time slots by category - Free, Students, Engineers, Professionals.",
  path: "/admin/bookings/slots",
});

export default async function AdminSlotsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/bookings/slots");
  }

  // Super-admin-only, matching the nav entry's superAdminOnly flag.
  if (session.user.role !== "super_admin") {
    redirect("/admin/bookings");
  }

  return (
    <>
      <PageHeader
        title="Session Slots"
        subtitle="Create and manage bookable time slots for each track - Free Session, Students, Engineers, and Professionals."
      />
      <div className="container-verlin py-10">
        <SlotsManager />
      </div>
    </>
  );
}
