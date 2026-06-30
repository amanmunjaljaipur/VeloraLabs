"use client";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookingWithAudience() {
  const params = useSearchParams();
  const audience = params.get("audience") || undefined;
  return <BookingFlow defaultAudience={audience} />;
}

export function BookingSection() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-text-secondary">Loading booking...</div>}>
      <BookingWithAudience />
    </Suspense>
  );
}