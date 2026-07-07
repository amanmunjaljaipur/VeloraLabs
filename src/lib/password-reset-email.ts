const DOMAIN_STATUS_TTL_MS = 5 * 60 * 1000;

let domainStatusCache: { domain: string; verified: boolean; checkedAt: number } | null = null;

async function isResendDomainVerified(domain: string, apiKey: string): Promise<boolean> {
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

async function getFromAddress(apiKey: string): Promise<string> {
  if (process.env.AUTH_FROM_EMAIL) {
    return process.env.AUTH_FROM_EMAIL;
  }

  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (domain && (await isResendDomainVerified(domain, apiKey))) {
    return `Verlin Labs <noreply@${domain}>`;
  }

  return (
    process.env.RESEND_FROM_EMAIL ??
    process.env.NEWSLETTER_FROM_EMAIL ??
    "Verlin Labs <onboarding@resend.dev>"
  );
}

function getPublicBaseUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #0d9488; font-weight: 600;">
        Verlin Labs
      </p>
      <h1 style="font-size: 24px; line-height: 1.3; margin: 12px 0 16px;">Reset your password</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">
        We received a request to reset the password for your Verlin Labs account.
        Click the button below to choose a new password. This link expires in 1 hour.
      </p>
      <p style="margin-top: 28px;">
        <a href="${resetUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email. Your password won't change
        unless you use the link above.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; word-break: break-all;">
        Or copy this link: ${resetUrl}
      </p>
    </div>
  `;
}

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail(
  email: string,
  plainToken: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Password reset email skipped: RESEND_API_KEY is not configured");
    return false;
  }

  const resetUrl = `${getPublicBaseUrl()}/login/reset-password?token=${encodeURIComponent(plainToken)}`;
  const from = await getFromAddress(apiKey);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Verlin Labs password",
      html: buildResetEmailHtml(resetUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Password reset email failed for ${email}:`, body);
    return false;
  }

  return true;
}