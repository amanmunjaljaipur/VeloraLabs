import { CONTACT_EMAIL } from "@/lib/brand-email";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/send-email";

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
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Questions? Reply to this email or write to ${CONTACT_EMAIL}.
      </p>
    </div>
  `;
}

export function isPasswordResetEmailConfigured(): boolean {
  return isTransactionalEmailConfigured();
}

export async function sendPasswordResetEmail(
  email: string,
  plainToken: string
): Promise<boolean> {
  const resetUrl = `${getPublicBaseUrl()}/login/reset-password?token=${encodeURIComponent(plainToken)}`;

  return sendTransactionalEmail({
    to: email,
    subject: "Reset your Verlin Labs password",
    html: buildResetEmailHtml(resetUrl),
    from: process.env.AUTH_FROM_EMAIL,
  });
}