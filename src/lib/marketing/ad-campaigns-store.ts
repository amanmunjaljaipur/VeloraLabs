import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";
import type { AdsPlatform } from "@/lib/marketing/ad-accounts-store";

/**
 * Paid campaign definitions for the Marketing Board's Phase 2 (paid ads
 * across Meta/LinkedIn/X). Named ad-campaigns-store.ts (not campaigns-
 * store.ts) because that name is already taken by the Email Suite's send
 * campaigns - different domain, would have silently overwritten it.
 *
 * Every campaign is created in "draft" and only ever moves to "active"
 * through an explicit, separate /activate call the admin triggers
 * themselves in the dashboard - this store never auto-spends anything on
 * its own. Mirrors the tenant-scoping and Blob-backed persistence pattern
 * already used by posts-store.ts / accounts-store.ts.
 */

const AD_CAMPAIGNS_FILE = "marketing-campaigns.json";
const DEFAULT_JSON = "[]";

export type CampaignObjective = "awareness" | "traffic" | "engagement" | "leads" | "conversions";
export type AdCampaignStatus = "draft" | "activating" | "active" | "paused" | "failed" | "completed";

export interface CampaignTargeting {
  locations: string[];
  ageMin: number;
  ageMax: number;
  genders: "all" | "male" | "female";
  interests: string[];
}

export interface CampaignBudget {
  type: "daily" | "lifetime";
  amount: number;
  currency: string;
}

export interface CampaignSchedule {
  startDate: string;
  endDate: string | null;
}

export interface CampaignCreative {
  headline: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string;
  callToAction: string;
}

export interface AdCampaign {
  id: string;
  tenantId: string;
  platform: AdsPlatform;
  name: string;
  objective: CampaignObjective;
  status: AdCampaignStatus;
  budget: CampaignBudget;
  schedule: CampaignSchedule;
  targeting: CampaignTargeting;
  creative: CampaignCreative;
  /** IDs returned by the platform once submitted - shape varies per platform (campaign/adset/ad, or campaignGroup/campaign, or campaign/lineItem/promotedTweet). */
  platformIds: Record<string, string>;
  error: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
}

async function readAll(): Promise<AdCampaign[]> {
  await ensureDataFileHydrated(AD_CAMPAIGNS_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<AdCampaign[]>(AD_CAMPAIGNS_FILE, DEFAULT_JSON);
  return all.map((c) => (c.tenantId ? c : { ...c, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: AdCampaign[]): Promise<void> {
  await writeJsonFileAsync(AD_CAMPAIGNS_FILE, items, DEFAULT_JSON);
}

export async function listAdCampaigns(tenantId: string): Promise<AdCampaign[]> {
  const all = await readAll();
  return all.filter((c) => c.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAdCampaign(id: string, tenantId: string): Promise<AdCampaign | null> {
  const all = await readAll();
  return all.find((c) => c.id === id && c.tenantId === tenantId) ?? null;
}

export async function createAdCampaign(input: {
  tenantId: string;
  platform: AdsPlatform;
  name: string;
  objective: CampaignObjective;
  budget: CampaignBudget;
  schedule: CampaignSchedule;
  targeting: CampaignTargeting;
  creative: CampaignCreative;
  createdBy: string;
}): Promise<AdCampaign> {
  const all = await readAll();
  const now = new Date().toISOString();
  const record: AdCampaign = {
    id: randomUUID(),
    tenantId: input.tenantId,
    platform: input.platform,
    name: input.name,
    objective: input.objective,
    // Always born paused/draft - never created active. See module docstring.
    status: "draft",
    budget: input.budget,
    schedule: input.schedule,
    targeting: input.targeting,
    creative: input.creative,
    platformIds: {},
    error: null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    activatedAt: null,
  };
  all.push(record);
  await writeAll(all);
  return record;
}

export async function updateAdCampaign(
  id: string,
  tenantId: string,
  patch: Partial<Pick<AdCampaign, "status" | "platformIds" | "error" | "activatedAt">>
): Promise<AdCampaign | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id && c.tenantId === tenantId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx]!, ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx]!;
}

export async function deleteAdCampaign(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((c) => !(c.id === id && c.tenantId === tenantId));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
