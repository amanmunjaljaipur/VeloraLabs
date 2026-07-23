import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/auth";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Free Session Bookings",
  description: "Slot occupancy and booking list for the Verlin Labs free session calendar.",
  path: "/admin/bookings",
});

export default async function AdminBookingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/bookings");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Free Session Bookings"
        subtitle="See how many of the 5 daily slots are booked, shared across students, engineers, and professionals."
        cta={{ label: "Manage session slots by category", href: "/admin/bookings/slots", variant: "secondary" }}
      />
      <BookingsPanel />
    </>
  );
}
