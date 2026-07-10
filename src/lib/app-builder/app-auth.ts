import { auth } from "@/auth";
import { roleHasCapability } from "@/lib/app-builder/default-roles";
import { clearAppSessionCookie, readAppSession, setAppSessionCookie } from "@/lib/app-builder/app-session";
import {
  ensureTenantForProject,
  findMember,
  getTenant,
  upsertMember,
  verifyMemberPassword,
} from "@/lib/app-builder/tenant-store";
import type { AppCapability, AppRoleDefinition, AppSessionPayload, AppTenant } from "@/lib/app-builder/tenant-types";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { ensureRolesLoaded, getRoleForEmail } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";

export interface AppAuthContext {
  slug: string;
  session: AppSessionPayload;
  tenant: AppTenant;
  role: AppRoleDefinition;
  /** True when access is via Verlin Labs platform super_admin bridge */
  viaPlatformSuperAdmin?: boolean;
}

/**
 * Platform Verlin Labs super_admin always has Owner powers on every generated app.
 * The app creator is also Owner (stored as member).
 */
export async function resolveAppAccess(slug: string): Promise<AppAuthContext | null> {
  let tenant = await getTenant(slug);
  if (!tenant) {
    const project = await getAppProjectBySlug(slug);
    if (project?.status === "live") {
      tenant = await ensureTenantForProject(project);
    }
  }
  if (!tenant) return null;

  const appSession = await readAppSession(slug);
  if (appSession) {
    const member = tenant.members.find(
      (m) => m.email === appSession.email.toLowerCase() || m.id === appSession.memberId
    );
    // Owner email always super_admin even if role was tampered
    let roleId = member?.roleId || appSession.roleId;
    if (tenant.ownerEmail && appSession.email.toLowerCase() === tenant.ownerEmail) {
      roleId = "super_admin";
    }
    const role = tenant.roles.find((r) => r.id === roleId) || tenant.roles.find((r) => r.id === "customer");
    if (!role) return null;
    return {
      slug,
      session: { ...appSession, roleId: role.id },
      tenant,
      role,
    };
  }

  // Bridge: logged into Verlin Labs as platform super_admin
  try {
    await ensureRolesLoaded();
    const vl = await auth();
    const email = vl?.user?.email?.toLowerCase();
    const platformRole = email ? getRoleForEmail(email) ?? vl?.user?.role : null;
    if (email && isSuperAdminRole(platformRole)) {
      const role =
        tenant.roles.find((r) => r.id === "super_admin") ||
        tenant.roles.find((r) => r.capabilities.includes("*"));
      if (!role) return null;
      return {
        slug,
        session: {
          slug,
          email,
          name: vl?.user?.name || "Platform Super Admin",
          roleId: role.id,
          memberId: "platform-super-admin",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        tenant,
        role,
        viaPlatformSuperAdmin: true,
      };
    }
  } catch {
    // ignore platform session errors
  }

  return null;
}

export async function requireAppCapability(
  slug: string,
  capability: AppCapability
): Promise<AppAuthContext | null> {
  const ctx = await resolveAppAccess(slug);
  if (!ctx) return null;
  if (!roleHasCapability(ctx.role, capability)) return null;
  return ctx;
}

export async function loginAppUser(
  slug: string,
  email: string,
  password: string
): Promise<{ ok: true; memberEmail: string } | { ok: false; error: string }> {
  const tenant = await getTenant(slug);
  if (!tenant) return { ok: false, error: "Shop not found" };

  const member = await verifyMemberPassword(slug, email, password);
  if (!member) {
    // Allow owner first-time: if email is owner and they use a new password after claim flow
    return { ok: false, error: "Invalid email or password for this shop" };
  }

  let roleId = member.roleId;
  if (tenant.ownerEmail && member.email === tenant.ownerEmail) {
    roleId = "super_admin";
  }

  await setAppSessionCookie(slug, {
    slug,
    email: member.email,
    name: member.name,
    roleId,
    memberId: member.id,
  });

  return { ok: true, memberEmail: member.email };
}

export async function signupAppUser(
  slug: string,
  input: { email: string; password: string; name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tenant = await getTenant(slug);
  if (!tenant) return { ok: false, error: "Shop not found" };

  const email = input.email.toLowerCase().trim();
  if (!email.includes("@") || input.password.length < 8) {
    return { ok: false, error: "Use a valid email and password of at least 8 characters" };
  }

  const existing = await findMember(slug, email);
  const isOwner = Boolean(tenant.ownerEmail && email === tenant.ownerEmail);

  // Creator is pre-seeded as Owner without a real password — first "sign up" claims it
  if (existing && !(isOwner && existing.member.source === "creator")) {
    return { ok: false, error: "An account with this email already exists. Please sign in." };
  }

  const roleId = isOwner ? "super_admin" : tenant.defaultRoleId || "customer";

  const member = await upsertMember(slug, {
    email,
    name: input.name || existing?.member.name || email.split("@")[0],
    password: input.password,
    roleId,
    source: isOwner ? "creator" : "signup",
  });

  await setAppSessionCookie(slug, {
    slug,
    email: member.email,
    name: member.name,
    roleId: member.roleId,
    memberId: member.id,
  });

  return { ok: true };
}

export async function logoutAppUser(slug: string): Promise<void> {
  await clearAppSessionCookie(slug);
}

export function publicSessionView(ctx: AppAuthContext | null) {
  if (!ctx) return null;
  return {
    email: ctx.session.email,
    name: ctx.session.name,
    roleId: ctx.role.id,
    roleLabel: ctx.role.label,
    capabilities: ctx.role.capabilities,
    viaPlatformSuperAdmin: ctx.viaPlatformSuperAdmin === true,
    isStaff: roleHasCapability(ctx.role, "orders.manage") || roleHasCapability(ctx.role, "*"),
    isAdmin:
      roleHasCapability(ctx.role, "*") ||
      roleHasCapability(ctx.role, "products.edit") ||
      roleHasCapability(ctx.role, "settings.edit"),
    isOwner: roleHasCapability(ctx.role, "*"),
  };
}
