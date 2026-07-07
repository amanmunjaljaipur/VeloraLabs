"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the homepage statically renderable; routes enrolled learners client-side. */
export function HomePageGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    if (session.user.enrolledLearner) {
      router.replace("/my-course");
    }
  }, [status, session, router]);

  return children;
}