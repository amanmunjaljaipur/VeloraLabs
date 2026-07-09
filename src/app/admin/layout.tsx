import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session-access";
import { noIndexMetadata } from "@/lib/page-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = noIndexMetadata(
  "Admin",
  "Verlin Labs admin dashboard.",
  "/admin"
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="container-verlin py-6 md:py-8">
      <div className="min-w-0">{children}</div>
    </div>
  );
}