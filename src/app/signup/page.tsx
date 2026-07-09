import { auth } from "@/auth";
import { SignupForm } from "./SignupForm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}