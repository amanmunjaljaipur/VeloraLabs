import { auth } from "@/auth";
import type { Session } from "next-auth";

/** Best-effort session lookup — never throws (public pages keep rendering). */
export async function getOptionalSession(): Promise<Session | null> {
  try {
    return (await auth()) ?? null;
  } catch (error) {
    console.error("Auth session lookup failed:", error);
    return null;
  }
}