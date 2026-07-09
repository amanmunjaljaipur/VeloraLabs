import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = noIndexMetadata(
  "Create Account",
  "Create your Verlin Labs learner account.",
  "/signup"
);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}