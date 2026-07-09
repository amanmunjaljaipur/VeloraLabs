import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";
import { isAdminRole } from "@/lib/session-access";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(isAdminRole(session.user.role) ? "/admin/sessions" : "/");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}