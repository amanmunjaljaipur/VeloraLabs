export const BRAND_NAME = "Verlin Labs";

/** Public support / contact inbox shown on the site and used as reply-to. */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@verlinlabs.com";

/** Default transactional sender once the domain is verified in Resend. */
export function getDefaultFromAddress(): string {
  return `${BRAND_NAME} <${CONTACT_EMAIL}>`;
}

export function resolveFromAddress(
  preferred?: string | null,
  fallback = getDefaultFromAddress()
): string {
  return preferred?.trim() || fallback;
}