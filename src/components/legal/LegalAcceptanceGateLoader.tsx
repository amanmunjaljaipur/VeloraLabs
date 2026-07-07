"use client";

import dynamic from "next/dynamic";

const LegalAcceptanceGate = dynamic(
  () => import("@/components/legal/LegalAcceptanceGate").then((m) => m.LegalAcceptanceGate),
  { ssr: false }
);

export function LegalAcceptanceGateLoader() {
  return <LegalAcceptanceGate />;
}