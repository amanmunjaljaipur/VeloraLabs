import type { AppCapability, AppRoleDefinition } from "@/lib/app-builder/tenant-types";

/** Built-in roles for a local shop app - owners can rename labels / add custom roles. */
export const DEFAULT_ECOM_ROLES: AppRoleDefinition[] = [
  {
    id: "super_admin",
    label: "Owner",
    description:
      "Full control of this shop: products, orders, team, roles, and settings. Same power level as your main platform super admin for this app only.",
    capabilities: ["*"],
    system: true,
  },
  {
    id: "admin",
    label: "Manager",
    description:
      "Run day-to-day: edit products, manage orders & customers, invite staff. Cannot remove the Owner or redefine Owner powers.",
    capabilities: [
      "products.view",
      "products.edit",
      "orders.view",
      "orders.manage",
      "customers.view",
      "customers.manage",
      "team.view",
      "team.manage",
      "settings.edit",
      "analytics.view",
      "inquiries.manage",
      "data.view",
      "data.manage",
    ],
    system: true,
  },
  {
    id: "staff",
    label: "Staff",
    description: "Help with orders and customer messages. Can view products but not change team roles.",
    capabilities: [
      "products.view",
      "orders.view",
      "orders.manage",
      "customers.view",
      "inquiries.manage",
      "data.view",
      "data.manage",
    ],
    system: true,
  },
  {
    id: "customer",
    label: "Customer",
    description: "Default role for anyone who signs up to this shop - browse, place orders, manage their profile.",
    capabilities: ["shop.browse", "orders.own", "profile.edit"],
    system: true,
    isDefault: true,
  },
];

export function roleHasCapability(
  role: AppRoleDefinition | undefined,
  capability: AppCapability
): boolean {
  if (!role) return false;
  if (role.capabilities.includes("*")) return true;
  return role.capabilities.includes(capability);
}

export function getDefaultRoleId(roles: AppRoleDefinition[]): string {
  return roles.find((r) => r.isDefault)?.id || roles.find((r) => r.id === "customer")?.id || "customer";
}
