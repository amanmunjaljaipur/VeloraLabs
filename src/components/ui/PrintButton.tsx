"use client";

import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}