import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Lightweight CRM-lite for the Email Suite: leads captured from inbox
 * triage ("lead" tag), the marketing site, or manual entry, so a
 * campaign can be sent to "everyone tagged lead" without leaving the
 * Marketing Board.
 */

const LEADS_FILE = "marketing-leads.json";
const DEFAULT_JSON = "[]";

export type LeadStatus = "new" | "contacted" | "qualified" | "customer" | "lost";
export type LeadSource = "inbox" | "manual" | "website";

export interface Lead {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

async function readAll(): Promise<Lead[]> {
  await ensureDataFileHydrated(LEADS_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<Lead[]>(LEADS_FILE, DEFAULT_JSON);
  return all.map((l) => (l.tenantId ? l : { ...l, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: Lead[]): Promise<void> {
  await writeJsonFileAsync(LEADS_FILE, items, DEFAULT_JSON);
}

export async function listLeads(tenantId: string): Promise<Lead[]> {
  const all = await readAll();
  return all.filter((l) => l.tenantId === tenantId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertLead(input: {
  tenantId: string;
  email: string;
  name?: string | null;
  company?: string | null;
  source: LeadSource;
  notes?: string | null;
}): Promise<Lead> {
  const all = await readAll();
  const email = input.email.trim().toLowerCase();
  const existing = all.find((l) => l.email === email && l.tenantId === input.tenantId);
  const now = new Date().toISOString();

  if (existing) {
    existing.name = input.name ?? existing.name;
    existing.company = input.company ?? existing.company;
    existing.notes = input.notes ?? existing.notes;
    existing.updatedAt = now;
    await writeAll(all);
    return existing;
  }

  const lead: Lead = {
    id: randomUUID(),
    tenantId: input.tenantId,
    email,
    name: input.name ?? null,
    company: input.company ?? null,
    status: "new",
    source: input.source,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  all.push(lead);
  await writeAll(all);
  return lead;
}

export async function updateLeadStatus(id: string, tenantId: string, status: LeadStatus): Promise<Lead | null> {
  const all = await readAll();
  const lead = all.find((l) => l.id === id && l.tenantId === tenantId);
  if (!lead) return null;
  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  await writeAll(all);
  return lead;
}

export async function deleteLead(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((l) => l.id === id && l.tenantId === tenantId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}
