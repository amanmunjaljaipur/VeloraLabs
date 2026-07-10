import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import { DEFAULT_ECOM_ROLES, getDefaultRoleId } from "@/lib/app-builder/default-roles";
import type {
  AppInquiry,
  AppOrder,
  AppRoleDefinition,
  AppTenant,
  AppTenantMember,
  AppTenantStore,
} from "@/lib/app-builder/tenant-types";
import type { AppProject } from "@/lib/app-builder/types";
import bcrypt from "bcryptjs";

const FILE = "app-builder-tenants.json";
const EMPTY: AppTenantStore = { version: 1, updatedAt: new Date().toISOString(), tenants: {} };
const EMPTY_JSON = JSON.stringify(EMPTY);
const SALT = 12;

let cache: AppTenantStore | null = null;
let cacheAt = 0;
let loadPromise: Promise<void> | null = null;
const TTL = 3_000;

function readLocal(): AppTenantStore {
  const data = readJsonFile<AppTenantStore>(FILE, EMPTY_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    tenants: data.tenants && typeof data.tenants === "object" ? data.tenants : {},
  };
}

export async function ensureTenantsLoaded(force = false): Promise<AppTenantStore> {
  if (!force && cache && Date.now() - cacheAt < TTL) return cache;
  if (loadPromise) {
    await loadPromise;
    return cache ?? readLocal();
  }
  loadPromise = (async () => {
    await ensureDataFileHydrated(FILE, EMPTY_JSON, { force: true });
    cache = readLocal();
    cacheAt = Date.now();
  })();
  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
  return cache ?? readLocal();
}

async function writeStore(store: AppTenantStore): Promise<void> {
  const next = { ...store, updatedAt: new Date().toISOString() };
  await writeJsonFileAsync(FILE, next, EMPTY_JSON);
  cache = next;
  cacheAt = Date.now();
}

export async function getTenant(slug: string): Promise<AppTenant | null> {
  const store = await ensureTenantsLoaded();
  return store.tenants[slug] ?? null;
}

export async function saveTenant(tenant: AppTenant): Promise<AppTenant> {
  const store = await ensureTenantsLoaded(true);
  store.tenants[tenant.slug] = { ...tenant, updatedAt: new Date().toISOString() };
  await writeStore(store);
  return store.tenants[tenant.slug];
}

/** Create tenant auth for a published app (idempotent). */
export async function ensureTenantForProject(project: AppProject): Promise<AppTenant> {
  const store = await ensureTenantsLoaded(true);
  const existing = store.tenants[project.slug];
  if (existing) {
    // Keep brand / owner in sync
    existing.brandName = project.content?.brandName || project.name;
    existing.projectId = project.id;
    if (project.createdBy && !existing.ownerEmail) {
      existing.ownerEmail = project.createdBy.toLowerCase();
    }
    await writeStore(store);
    return existing;
  }

  const ownerEmail = (project.createdBy || "").toLowerCase().trim();
  const roles = structuredClone(DEFAULT_ECOM_ROLES);
  const members: AppTenantMember[] = [];

  if (ownerEmail) {
    members.push({
      id: `m-${Date.now().toString(36)}-owner`,
      email: ownerEmail,
      name: project.content?.brandName || project.name || "Owner",
      // Owner signs in via app signup or we set password on first claim
      passwordHash: await bcrypt.hash(`pending-${ownerEmail}-${project.id}`, SALT),
      roleId: "super_admin",
      createdAt: new Date().toISOString(),
      source: "creator",
    });
  }

  const tenant: AppTenant = {
    slug: project.slug,
    projectId: project.id,
    brandName: project.content?.brandName || project.name,
    ownerEmail,
    roles,
    defaultRoleId: getDefaultRoleId(roles),
    members,
    orders: [],
    inquiries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.tenants[project.slug] = tenant;
  await writeStore(store);
  return tenant;
}

export async function findMember(
  slug: string,
  email: string
): Promise<{ tenant: AppTenant; member: AppTenantMember } | null> {
  const tenant = await getTenant(slug);
  if (!tenant) return null;
  const normalized = email.toLowerCase().trim();
  const member = tenant.members.find((m) => m.email === normalized);
  if (!member) return null;
  return { tenant, member };
}

export async function upsertMember(
  slug: string,
  input: {
    email: string;
    name: string;
    password?: string;
    roleId: string;
    source?: string;
  }
): Promise<AppTenantMember> {
  const tenant = await getTenant(slug);
  if (!tenant) throw new Error("Tenant not found");

  const email = input.email.toLowerCase().trim();
  const existing = tenant.members.find((m) => m.email === email);
  if (existing) {
    existing.name = input.name || existing.name;
    existing.roleId = input.roleId || existing.roleId;
    if (input.password) {
      existing.passwordHash = await bcrypt.hash(input.password, SALT);
    }
    await saveTenant(tenant);
    return existing;
  }

  if (!input.password) throw new Error("Password required for new member");

  const member: AppTenantMember = {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    name: input.name.trim() || email.split("@")[0],
    passwordHash: await bcrypt.hash(input.password, SALT),
    roleId: input.roleId,
    createdAt: new Date().toISOString(),
    source: input.source || "signup",
  };
  tenant.members.push(member);
  await saveTenant(tenant);
  return member;
}

export async function verifyMemberPassword(
  slug: string,
  email: string,
  password: string
): Promise<AppTenantMember | null> {
  const found = await findMember(slug, email);
  if (!found) return null;
  const ok = await bcrypt.compare(password, found.member.passwordHash);
  if (!ok) return null;
  found.member.lastLoginAt = new Date().toISOString();
  await saveTenant(found.tenant);
  return found.member;
}

export async function setTenantRoles(
  slug: string,
  roles: AppRoleDefinition[],
  defaultRoleId: string
): Promise<AppTenant> {
  const tenant = await getTenant(slug);
  if (!tenant) throw new Error("Tenant not found");
  tenant.roles = roles;
  tenant.defaultRoleId = defaultRoleId;
  return saveTenant(tenant);
}

export async function addOrder(slug: string, order: Omit<AppOrder, "id" | "createdAt" | "updatedAt" | "status"> & { status?: AppOrder["status"] }): Promise<AppOrder> {
  const tenant = await getTenant(slug);
  if (!tenant) throw new Error("Tenant not found");
  const now = new Date().toISOString();
  const row: AppOrder = {
    id: `ord-${Date.now().toString(36)}`,
    ...order,
    status: order.status || "new",
    createdAt: now,
    updatedAt: now,
  };
  tenant.orders.unshift(row);
  await saveTenant(tenant);
  return row;
}

export async function updateOrderStatus(
  slug: string,
  orderId: string,
  status: AppOrder["status"]
): Promise<AppOrder | null> {
  const tenant = await getTenant(slug);
  if (!tenant) return null;
  const order = tenant.orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await saveTenant(tenant);
  return order;
}

export async function addInquiry(
  slug: string,
  input: Omit<AppInquiry, "id" | "createdAt" | "status">
): Promise<AppInquiry> {
  const tenant = await getTenant(slug);
  if (!tenant) throw new Error("Tenant not found");
  const row: AppInquiry = {
    id: `inq-${Date.now().toString(36)}`,
    ...input,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  tenant.inquiries.unshift(row);
  await saveTenant(tenant);
  return row;
}

export async function deleteTenant(slug: string): Promise<void> {
  const store = await ensureTenantsLoaded(true);
  delete store.tenants[slug];
  await writeStore(store);
}
