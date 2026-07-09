import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = noIndexMetadata(
  "Sign In",
  "Sign in to your Verlin Labs account.",
  "/login"
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}