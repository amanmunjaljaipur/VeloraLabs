import { VerlinBankDemo } from "@/components/admin/VerlinBankDemo";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata = noIndexMetadata(
  "Verlin Bank Prototype",
  "Verlin Bank (Project Aura) digital banking prototype with RBAC & AI agents.",
  "/admin/verlin-bank"
);

export default function VerlinBankPage() {
  return <VerlinBankDemo />;
}
