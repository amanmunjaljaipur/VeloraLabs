import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * AI-sourced cold-outreach prospects (see ai-prospect-finder.ts). These are
 * NOT verified contacts - the app has no paid people/email-enrichment API
 * (Apollo/Clay/ZoomInfo etc.) wired in, so a prospect is an AI-suggested
 * target profile plus a pattern-guessed email address that a human should
 * confirm before relying on it. "Promote to lead" moves a confirmed
 * prospect into leads-store.ts, which IS what campaigns actually send to.
 */

const PROSPECTS_FILE = "marketing-prospects.json";
const DEFAULT_JSON = "[]";

export type ProspectStatus = "suggested" | "confirmed" | "promoted" | "rejected";

export interface Prospect {
  id: string;
  tenantId: string;
  name: string | null;
  title: string | null;
  company: string;
  domain: string | null;
  guessedEmails: string[];
  rationale: string;
  status: ProspectStatus;
  sourcePrompt: string;
  createdAt: string;
}

async function readAll(): Promise<Prospect[]> {
  await ensureDataFileHydrated(PROSPECTS_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<Prospect[]>(PROSPECTS_FILE, DEFAULT_JSON);
  return all.map((p) => (p.tenantId ? p : { ...p, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: Prospect[]): Promise<void> {
  await writeJsonFileAsync(PROSPECTS_FILE, items, DEFAULT_JSON);
}

export async function listProspects(tenantId: string): Promise<Prospect[]> {
  const all = await readAll();
  return all.filter((p) => p.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addProspects(
  tenantId: string,
  sourcePrompt: string,
  items: Array<{ name: string | null; title: string | null; company: string; domain: string | null; guessedEmails: string[]; rationale: string }>
): Promise<Prospect[]> {
  const all = await readAll();
  const created = items.map((item) => ({
    id: randomUUID(),
    tenantId,
    name: item.name,
    title: item.title,
    company: item.company,
    domain: item.domain,
    guessedEmails: item.guessedEmails,
    rationale: item.rationale,
    status: "suggested" as ProspectStatus,
    sourcePrompt,
    createdAt: new Date().toISOString(),
  }));
  all.push(...created);
  await writeAll(all);
  return created;
}

export async function updateProspectStatus(
  id: string,
  tenantId: string,
  status: ProspectStatus
): Promise<Prospect | null> {
  const all = await readAll();
  const prospect = all.find((p) => p.id === id && p.tenantId === tenantId);
  if (!prospect) return null;
  prospect.status = status;
  await writeAll(all);
  return prospect;
}

export async function deleteProspect(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id && p.tenantId === tenantId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}
