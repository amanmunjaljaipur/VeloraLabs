import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Email campaigns for the Email Suite - the "email" equivalent of the
 * social Marketing Board's posts. A campaign is a subject+HTML body sent
 * to a resolved recipient list (explicit addresses and/or "all leads"),
 * either immediately or at a scheduled time (drained by the same style of
 * cron used for scheduled social posts). Suppression-list filtering
 * happens at send time, never at creation time, so the "would send to N"
 * count in the UI stays accurate even if someone unsubscribes later.
 */

const CAMPAIGNS_FILE = "marketing-email-campaigns.json";
const DEFAULT_JSON = "[]";

export type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";

export interface Campaign {
  id: string;
  tenantId: string;
  subject: string;
  html: string;
  /** Explicit recipient addresses */
  recipients: string[];
  /** If true, also sends to every lead in leads-store.ts (deduped with recipients) */
  includeAllLeads: boolean;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
}

async function readAll(): Promise<Campaign[]> {
  await ensureDataFileHydrated(CAMPAIGNS_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<Campaign[]>(CAMPAIGNS_FILE, DEFAULT_JSON);
  return all.map((c) => (c.tenantId ? c : { ...c, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: Campaign[]): Promise<void> {
  await writeJsonFileAsync(CAMPAIGNS_FILE, items, DEFAULT_JSON);
}

export async function listCampaigns(tenantId: string): Promise<Campaign[]> {
  const all = await readAll();
  return all.filter((c) => c.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createCampaign(input: {
  tenantId: string;
  subject: string;
  html: string;
  recipients: string[];
  includeAllLeads: boolean;
  scheduledAt: string | null;
  createdBy: string;
}): Promise<Campaign> {
  const all = await readAll();
  const campaign: Campaign = {
    id: randomUUID(),
    tenantId: input.tenantId,
    subject: input.subject,
    html: input.html,
    recipients: input.recipients,
    includeAllLeads: input.includeAllLeads,
    status: input.scheduledAt ? "scheduled" : "draft",
    scheduledAt: input.scheduledAt,
    sentAt: null,
    sentCount: 0,
    failedCount: 0,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  all.push(campaign);
  await writeAll(all);
  return campaign;
}

export async function getCampaign(id: string, tenantId: string): Promise<Campaign | null> {
  const all = await readAll();
  return all.find((c) => c.id === id && c.tenantId === tenantId) ?? null;
}

export async function cancelCampaign(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id && c.tenantId === tenantId && c.status === "scheduled");
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}

/** Atomically claim due scheduled campaigns so a crashed cron can't double-send. */
export async function claimDueCampaigns(now = new Date()): Promise<Campaign[]> {
  const all = await readAll();
  const nowIso = now.toISOString();
  const due = all.filter((c) => c.status === "scheduled" && c.scheduledAt && c.scheduledAt <= nowIso);
  if (due.length === 0) return [];

  for (const campaign of all) {
    if (campaign.status === "scheduled" && campaign.scheduledAt && campaign.scheduledAt <= nowIso) {
      campaign.status = "failed";
    }
  }
  await writeAll(all);
  return due;
}

export async function completeCampaign(
  id: string,
  outcome: { status: "sent" | "failed"; sentCount: number; failedCount: number }
): Promise<void> {
  const all = await readAll();
  const campaign = all.find((c) => c.id === id);
  if (!campaign) return;
  campaign.status = outcome.status;
  campaign.sentCount = outcome.sentCount;
  campaign.failedCount = outcome.failedCount;
  campaign.sentAt = new Date().toISOString();
  await writeAll(all);
}
