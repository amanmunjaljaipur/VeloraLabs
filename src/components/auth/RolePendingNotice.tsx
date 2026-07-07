"use client";

import { ROLE_PENDING_LABEL } from "@/types/roles";
import { Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const HIDE_ON_PREFIXES = ["/login", "/signup", "/admin"];

export function RolePendingNotice() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated" || !session?.user?.rolePending) {
    return null;
  }

  if (HIDE_ON_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/25 bg-amber-500/10">
      <div className="container-verlin flex items-start gap-3 px-4 py-3 md:px-8">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 text-sm text-foreground">
          <p className="font-semibold">{ROLE_PENDING_LABEL}</p>
          <p className="mt-0.5 text-text-secondary">
            Your account is active, but an admin still needs to assign your learner track (Student,
            Engineer, or Professional). You can browse the site meanwhile — course access unlocks after
            assignment.
          </p>
        </div>
      </div>
    </div>
  );
}