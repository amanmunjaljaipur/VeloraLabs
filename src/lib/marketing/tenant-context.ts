import { isHardcodedSuperAdmin } from "@/lib/roles";
import { DEFAULT_TENANT_ID, ensureDefaultTenant, findTenantByMemberEmail } from "@/lib/marketing/tenants-store";

/**
 * Resolves which workspace (tenant) the current admin session belongs to.
 * Every Marketing Board API route calls this - server-side, from the
 * authenticated session, NEVER from a client-supplied tenantId - and uses
 * the result to scope every store read/write. This is what makes the
 * multi-tenant isolation actually enforceable rather than just a field
 * that a client could spoof.
 *
 * Anyone who isn't a member of a created tenant falls back to the
 * "default" tenant (Verlin Labs' own workspace, auto-provisioned on first
 * use) - this keeps the site's existing Marketing Board behavior
 * unchanged for its own admins while giving every NEW tenant true
 * isolation from it and from each other.
 */
export async function resolveTenantId(email: string | null | undefined): Promise<string> {
  if (!email) return DEFAULT_TENANT_ID;

  const tenant = await findTenantByMemberEmail(email);
  if (tenant) return tenant.id;

  // Not a member of any created tenant - fall back to the default
  // workspace, auto-provisioning it (idempotent) the first time anyone
  // hits the Marketing Board post-migration.
  await ensureDefaultTenant(email);
  return DEFAULT_TENANT_ID;
}

export function isPlatformOwner(email: string | null | undefined): boolean {
  return isHardcodedSuperAdmin(email);
}
