import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Reusable email templates for the Email Suite's campaign composer - can
 * be hand-written or AI-generated (see ai-email-templates.ts), and may
 * include an AI-generated header image. Selecting a template in Campaigns
 * pre-fills subject/html, which the sender still runs through the usual
 * compliance footer + suppression filtering.
 */

const TEMPLATES_FILE = "marketing-email-templates.json";
const DEFAULT_JSON = "[]";

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  html: string;
  imageUrl: string | null;
  generatedByAi: boolean;
  createdBy: string;
  createdAt: string;
}

async function readAll(): Promise<EmailTemplate[]> {
  await ensureDataFileHydrated(TEMPLATES_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<EmailTemplate[]>(TEMPLATES_FILE, DEFAULT_JSON);
  return all.map((t) => (t.tenantId ? t : { ...t, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: EmailTemplate[]): Promise<void> {
  await writeJsonFileAsync(TEMPLATES_FILE, items, DEFAULT_JSON);
}

export async function listEmailTemplates(tenantId: string): Promise<EmailTemplate[]> {
  const all = await readAll();
  return all.filter((t) => t.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEmailTemplate(id: string, tenantId: string): Promise<EmailTemplate | null> {
  const all = await readAll();
  return all.find((t) => t.id === id && t.tenantId === tenantId) ?? null;
}

export async function createEmailTemplate(input: {
  tenantId: string;
  name: string;
  subject: string;
  html: string;
  imageUrl?: string | null;
  generatedByAi?: boolean;
  createdBy: string;
}): Promise<EmailTemplate> {
  const all = await readAll();
  const template: EmailTemplate = {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    subject: input.subject,
    html: input.html,
    imageUrl: input.imageUrl ?? null,
    generatedByAi: input.generatedByAi ?? false,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  all.push(template);
  await writeAll(all);
  return template;
}

export async function deleteEmailTemplate(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id && t.tenantId === tenantId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}
