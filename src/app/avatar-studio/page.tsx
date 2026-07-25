import { auth } from "@/auth";
import { AvatarStudioApp } from "@/components/avatar-studio/AvatarStudioApp";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Avatar Studio",
  description: "Generate AI avatar videos from a script - single clips or long-form videos chained from multiple segments.",
};

export default async function AvatarStudioPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/avatar-studio");
  }

  return <AvatarStudioApp userEmail={session.user.email} userName={session.user.name ?? null} />;
}
