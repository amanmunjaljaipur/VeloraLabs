import { CONTACT_EMAIL, getDefaultFromAddress, resolveFromAddress } from "@/lib/brand-email";

const DOMAIN_STATUS_TTL_MS = 5 * 60 * 1000;

let domainStatusCache: { domain: string; verified: boolean; checkedAt: number } | null = null;

export async function isResendDomainVerified(
  domain: string,
  apiKey: string
): Promise<boolean> {
  if (
    domainStatusCache &&
    domainStatusCache.domain === domain &&
    Date.now() - domainStatusCache.checkedAt < DOMAIN_STATUS_TTL_MS
  ) {
    return domainStatusCache.verified;
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as {
      data?: Array<{ name: string; status: string }>;
    };
    const match = data.data?.find((entry) => entry.name === domain);
    const verified = match?.status === "verified";

    domainStatusCache = { domain, verified, checkedAt: Date.now() };
    return verified;
  } catch (error) {
    console.error("Failed to check Resend domain status:", error);
    return false;
  }
}

export async function getResendFromAddress(options?: {
  authPreferred?: string | null;
  newsletterPreferred?: string | null;
  apiKey?: string;
}): Promise<string> {
  const apiKey = options?.apiKey ?? process.env.RESEND_API_KEY;
  const explicit = resolveFromAddress(
    options?.authPreferred ?? options?.newsletterPreferred ?? null,
    ""
  );

  if (explicit) {
    return explicit;
  }

  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (domain && apiKey && (await isResendDomainVerified(domain, apiKey))) {
    return getDefaultFromAddress();
  }

  return (
    process.env.RESEND_FROM_EMAIL ??
    process.env.AUTH_FROM_EMAIL ??
    process.env.NEWSLETTER_FROM_EMAIL ??
    getDefaultFromAddress()
  );
}

export function getResendReplyTo(): string {
  return CONTACT_EMAIL;
}