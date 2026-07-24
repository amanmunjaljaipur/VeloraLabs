import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Workspace/tenant model - the core primitive that turns the Marketing
 * Board from "Verlin Labs' internal tool" into a multi-customer product.
 * Every piece of Marketing Board data (connected accounts, posts, leads,
 * campaigns, inbox cache) is scoped to a tenantId so two customers' data
 * can never mix or leak into each other, even though they share the same
 * deployed app and the same underlying Meta/LinkedIn/X developer apps
 * (exactly how Buffer/Hootsuite work - one OAuth app, many customer
 * workspaces each connecting their own accounts through it).
 *
 * DEFAULT_TENANT_ID exists so the site's own pre-existing Marketing Board
 * data (connected before tenants existed) keeps working unchanged - it's
 * treated as tenant "default" everywhere without needing a migration
 * script. New tenants are fully isolated from it and from each other.
 */

const TENANTS_FILE = "marketing-tenants.json";
const DEFAULT_JSON = "[]";

export const DEFAULT_TENANT_ID = "default";

export type TenantPlan = "trial" | "pro" | "internal";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerEmail: string;
  /** Emails allowed to act as admin/super_admin within this tenant's Marketing Board */
  memberEmails: string[];
  plan: TenantPlan;
  createdAt: string;
}

async function readAll(): Promise<Tenant[]> {
  await ensureDataFileHydrated(TENANTS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<Tenant[]>(TENANTS_FILE, DEFAULT_JSON);
}

async function writeAll(items: Tenant[]): Promise<void> {
  await writeJsonFileAsync(TENANTS_FILE, items, DEFAULT_JSON);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || randomUUID().slice(0, 8);
}

export async function listTenants(): Promise<Tenant[]> {
  const all = await readAll();
  return [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const all = await readAll();
  return all.find((t) => t.id === id) ?? null;
}

/** Finds the tenant a given email is a member of. A user can belong to at most one workspace today - fine for a first cut. */
export async function findTenantByMemberEmail(email: string): Promise<Tenant | null> {
  const normalized = email.trim().toLowerCase();
  const all = await readAll();
  return all.find((t) => t.memberEmails.some((m) => m.toLowerCase() === normalized)) ?? null;
}

/**
 * Ensures the "default" tenant exists (idempotent) - this is Verlin Labs'
 * own workspace, holding all data created before tenants existed.
 */
export async function ensureDefaultTenant(ownerEmail: string): Promise<Tenant> {
  const all = await readAll();
  const existing = all.find((t) => t.id === DEFAULT_TENANT_ID);
  if (existing) return existing;

  const tenant: Tenant = {
    id: DEFAULT_TENANT_ID,
    slug: "verlin-labs",
    name: "Verlin Labs",
    ownerEmail,
    memberEmails: [ownerEmail],
    plan: "internal",
    createdAt: new Date().toISOString(),
  };
  all.push(tenant);
  await writeAll(all);
  return tenant;
}

/** Provisions a brand-new isolated workspace - the primitive a self-serve signup flow would call. */
export async function createTenant(input: { name: string; ownerEmail: string; plan?: TenantPlan }): Promise<Tenant> {
  const all = await readAll();
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let suffix = 1;
  while (all.some((t) => t.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const tenant: Tenant = {
    id: randomUUID(),
    slug,
    name: input.name.trim(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    memberEmails: [input.ownerEmail.trim().toLowerCase()],
    plan: input.plan ?? "trial",
    createdAt: new Date().toISOString(),
  };
  all.push(tenant);
  await writeAll(all);
  return tenant;
}

export async function addTenantMember(tenantId: string, email: string): Promise<Tenant | null> {
  const all = await readAll();
  const tenant = all.find((t) => t.id === tenantId);
  if (!tenant) return null;
  const normalized = email.trim().toLowerCase();
  if (!tenant.memberEmails.some((m) => m.toLowerCase() === normalized)) {
    tenant.memberEmails.push(normalized);
    await writeAll(all);
  }
  return tenant;
}
