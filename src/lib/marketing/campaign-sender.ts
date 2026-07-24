import { createHmac } from "crypto";
import { sendMailboxMessage } from "@/lib/marketing/mailbox-client";
import { filterSuppressed } from "@/lib/marketing/suppression-store";
import { listLeads } from "@/lib/marketing/leads-store";
import type { Campaign } from "@/lib/marketing/campaigns-store";
import { CONTACT_EMAIL, BRAND_NAME } from "@/lib/brand-email";

/**
 * Shared send path for campaigns - used by both the immediate-send API
 * route and the campaign cron, exactly like publisher.ts is shared by the
 * social "post now" and social cron. Every send goes through suppression
 * filtering and gets a CAN-SPAM-compliant footer (unsubscribe link +
 * physical/contact address) appended automatically - callers never have to
 * remember to add it.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verlinlabs.com").replace(/\/$/, "");
const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.NEXTAUTH_SECRET ?? "verlin-labs-unsub";
const BUSINESS_ADDRESS = process.env.BUSINESS_MAILING_ADDRESS ?? BRAND_NAME;

export function makeUnsubscribeToken(email: string): string {
  return createHmac("sha256", UNSUB_SECRET).update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  return makeUnsubscribeToken(email) === token;
}

function buildUnsubscribeUrl(email: string): string {
  const token = makeUnsubscribeToken(email);
  return `${SITE_URL}/api/marketing/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

function withComplianceFooter(html: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return `${html}
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb" />
<p style="font-size:12px;color:#6b7280;line-height:1.6">
  ${BUSINESS_ADDRESS}<br />
  You're receiving this email from ${BRAND_NAME}. <a href="${unsubUrl}">Unsubscribe</a> at any time,
  or contact us at ${CONTACT_EMAIL}.
</p>`;
}

export async function resolveCampaignRecipients(campaign: Pick<Campaign, "recipients" | "includeAllLeads">): Promise<string[]> {
  const set = new Set(campaign.recipients.map((e) => e.trim().toLowerCase()).filter(Boolean));
  if (campaign.includeAllLeads) {
    const leads = await listLeads();
    for (const lead of leads) set.add(lead.email);
  }
  return filterSuppressed(Array.from(set));
}

export async function sendCampaignNow(
  campaign: Pick<Campaign, "subject" | "html" | "recipients" | "includeAllLeads">
): Promise<{ sentCount: number; failedCount: number; recipients: string[] }> {
  const recipients = await resolveCampaignRecipients(campaign);
  let sentCount = 0;
  let failedCount = 0;

  for (const email of recipients) {
    const ok = await sendMailboxMessage({
      to: email,
      subject: campaign.subject,
      html: withComplianceFooter(campaign.html, email),
    });
    if (ok) sentCount += 1;
    else failedCount += 1;
  }

  return { sentCount, failedCount, recipients };
}
