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

function buildVerificationEmailHtml(verifyUrl: string, code: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #0d9488; font-weight: 600;">
        Verlin Labs
      </p>
      <h1 style="font-size: 24px; line-height: 1.3; margin: 12px 0 16px;">Verify your email</h1>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">
        Thanks for signing up. Confirm your email to finish creating your Verlin Labs account.
        Click the button below or enter the verification code on the sign-up page.
      </p>
      <p style="margin: 28px 0 12px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em;">
        Your verification code
      </p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em; color: #0f172a; margin: 0 0 24px;">
        ${code}
      </p>
      <p style="margin-top: 8px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
          Verify email
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
        This link and code expire in 24 hours. If you didn&apos;t create an account, you can ignore this email.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; word-break: break-all;">
        Or copy this link: ${verifyUrl}
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Questions? Reply to this email or write to ${CONTACT_EMAIL}.
      </p>
    </div>
  `;
}

export function isEmailVerificationConfigured(): boolean {
  return isTransactionalEmailConfigured();
}

export async function sendEmailVerificationEmail(
  email: string,
  plainToken: string,
  plainCode: string
): Promise<boolean> {
  const verifyUrl = `${getPublicBaseUrl()}/signup/verify-email?token=${encodeURIComponent(plainToken)}&email=${encodeURIComponent(email)}`;

  return sendTransactionalEmail({
    to: email,
    subject: "Verify your Verlin Labs email",
    html: buildVerificationEmailHtml(verifyUrl, plainCode),
    from: process.env.AUTH_FROM_EMAIL,
  });
}