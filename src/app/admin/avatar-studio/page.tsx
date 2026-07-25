import { AvatarStudioTrainingPanel } from "@/components/admin/AvatarStudioTrainingPanel";
import { auth } from "@/auth";
import { isSuperAdminRole } from "@/lib/session-access";
import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Avatar Studio - Training & Moderation",
  description: "Super Admin control of the Avatar Studio training loop and moderation queue.",
  path: "/admin/avatar-studio",
  noIndex: true,
});

export default async function AdminAvatarStudioPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/avatar-studio");
  }
  if (!isSuperAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return <AvatarStudioTrainingPanel />;
}
