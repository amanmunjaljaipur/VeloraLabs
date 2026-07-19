/** Roles & members for each generated app (tenant) - fully separate from Verlin Labs roles. */

export type AppCapability =
  | "*"
  | "products.view"
  | "products.edit"
  | "orders.view"
  | "orders.manage"
  | "customers.view"
  | "customers.manage"
  | "team.view"
  | "team.manage"
  | "roles.manage"
  | "settings.edit"
  | "analytics.view"
  | "shop.browse"
  | "orders.own"
  | "profile.edit"
  | "inquiries.manage"
  | "data.view"
  | "data.manage";

export interface AppRoleDefinition {
  id: string;
  label: string;
  description: string;
  capabilities: AppCapability[];
  /** Built-in role - cannot delete */
  system?: boolean;
  /** Assigned to new public sign-ups when no other rule matches */
  isDefault?: boolean;
}

export interface AppTenantMember {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  roleId: string;
  createdAt: string;
  lastLoginAt?: string;
  /** creator | invited | signup | platform_super_admin */
  source?: string;
}

export type AppOrderStatus = "new" | "confirmed" | "fulfilled" | "cancelled";

export interface AppOrder {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{ productId: string; name: string; price: string; qty: number }>;
  note?: string;
  status: AppOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "new" | "read" | "closed";
  createdAt: string;
}

/** Per-app CRM contact - always built with the shop (mirrors Verlin CRM idea, simpler). */
export type AppCrmStage = "new" | "contacted" | "customer" | "inactive";
export type AppCrmSource = "signup" | "order" | "inquiry" | "manual";

export interface AppCrmContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: AppCrmStage;
  source: AppCrmSource;
  notes?: string;
  orderCount: number;
  lastActivityAt: string;
  createdAt: string;
}

/** Generic CRUD record for non-ecommerce Forge data models (booking, tracker, CRM, etc.) */
export interface AppDataRecord {
  id: string;
  /** Arbitrary fields matching the ForgeDataModel field definitions */
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AppTenant {
  slug: string;
  projectId: string;
  brandName: string;
  /** Email of the Verlin user who created this app - always app super_admin */
  ownerEmail: string;
  roles: AppRoleDefinition[];
  /** Role id given to brand-new sign-ups (usually customer) */
  defaultRoleId: string;
  members: AppTenantMember[];
  orders: AppOrder[];
  inquiries: AppInquiry[];
  /** Customer CRM ledger for this app only */
  crmContacts: AppCrmContact[];
  /** Generic entity records for non-ecommerce Forge apps, keyed by data model id */
  records?: Record<string, AppDataRecord[]>;
  createdAt: string;
  updatedAt: string;
}

export interface AppTenantStore {
  version: number;
  updatedAt: string;
  tenants: Record<string, AppTenant>;
}

export interface AppSessionPayload {
  slug: string;
  email: string;
  name: string;
  roleId: string;
  memberId: string;
  exp: number;
}
