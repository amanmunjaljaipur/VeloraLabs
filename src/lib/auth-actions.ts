"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/";
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithLinkedIn(formData: FormData): Promise<void> {
  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/";
  await signIn("linkedin", { redirectTo: callbackUrl });
}
