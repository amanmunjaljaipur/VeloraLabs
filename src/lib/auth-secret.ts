const LOCAL_BUILD_PLACEHOLDER = "verlin-labs-local-build-only";

export function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  // Local `next build` can load a pulled `.env.production.local` with VERCEL=1.
  // Allow that phase to complete; real secrets are required on the live runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return LOCAL_BUILD_PLACEHOLDER;
  }

  if (process.env.VERCEL_ENV) {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET environment variable is required on Vercel."
    );
  }

  // Any production runtime (not only Vercel) must have a real secret
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET is required when NODE_ENV=production."
    );
  }

  return LOCAL_BUILD_PLACEHOLDER;
}