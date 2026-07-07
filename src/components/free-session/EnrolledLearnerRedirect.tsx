"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function EnrolledLearnerRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (session.user.enrolledLearner) {
      router.replace("/");
    }
  }, [status, session, router]);

  return null;
}