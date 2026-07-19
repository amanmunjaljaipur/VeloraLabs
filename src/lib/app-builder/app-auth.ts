import { auth } from "@/auth";
import { DEFAULT_ECOM_ROLES, roleHasCapability } from "@/lib/app-builder/default-roles";
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

/** Owner / super_admin always has full powers even if role row was corrupted */
function resolveTenantRole(
  tenant: AppTenant,
  roleId: string,
  isOwnerEmail: boolean
): AppRoleDefinition | null {
  const wantOwner = isOwnerEmail || roleId === "super_admin";
  if (wantOwner) {
    const fromTenant = tenant.roles.find((r) => r.id === "super_admin");
    if (fromTenant) {
      return {
        ...fromTenant,
        capabilities: ["*"],
        system: true,
        isDefault: false,
      };
    }
    const fallback =
      DEFAULT_ECOM_ROLES.find((r) => r.id === "super_admin") || DEFAULT_ECOM_ROLES[0];
    return { ...fallback, capabilities: ["*"] };
  }
  return (
    tenant.roles.find((r) => r.id === roleId) ||
    tenant.roles.find((r) => r.id === "customer") ||
    null
  );
}

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
    // Security: revoked/deleted members must not keep access via old cookie roleId
    if (!member) {
      // Owner email still listed as ownerEmail may claim without member row edge-case:
      // only allow if they match owner and a creator seed is missing (handled on signup).
      return null;
    }
    // Owner email always super_admin; re-bind role from live member row (not cookie)
    let roleId = member.roleId;
    const isOwnerEmail = Boolean(
      tenant.ownerEmail && appSession.email.toLowerCase() === tenant.ownerEmail
    );
    if (isOwnerEmail) {
      roleId = "super_admin";
    }
    const role = resolveTenantRole(tenant, roleId, isOwnerEmail);
    if (!role) return null;
    return {
      slug,
      session: {
        ...appSession,
        email: member.email,
        name: member.name || appSession.name,
        roleId: role.id,
        memberId: member.id,
      },
      tenant,
      role,
    };
  }

  // Bridge: logged into Verlin Labs (as any platform user)
  try {
    const vl = await auth();
    const email = vl?.user?.email?.toLowerCase();
    if (email) {
      // Single Sign On: auto-register and make super_admin by default
      const member = await upsertMember(slug, {
        email,
        name: vl?.user?.name || email.split("@")[0],
        roleId: "super_admin",
        source: "sso",
      });

      // Set cookie so they stay signed in!
      await setAppSessionCookie(slug, {
        slug,
        email: member.email,
        name: member.name,
        roleId: "super_admin",
        memberId: member.id,
      });

      const role = resolveTenantRole(tenant, "super_admin", true);
      if (role) {
        return {
          slug,
          session: {
            slug,
            email: member.email,
            name: member.name,
            roleId: "super_admin",
            memberId: member.id,
            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
          },
          tenant,
          role,
          viaPlatformSuperAdmin: true,
        };
      }
    }
  } catch (err) {
    console.error("SSO sign-in error:", err);
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

  // Security: public signup must never reset an existing account password.
  // Owner first-claim is ONE-TIME only while member.source === "creator"
  // (seeded with a pending hash). After claim, source becomes "claimed" forever.
  const canClaimOwner =
    isOwner && Boolean(existing) && existing!.member.source === "creator";

  if (existing && !canClaimOwner) {
    return { ok: false, error: "An account with this email already exists. Please sign in." };
  }

  if (isOwner && existing && existing.member.source !== "creator") {
    return { ok: false, error: "Owner already claimed this shop. Please sign in." };
  }

  const roleId = canClaimOwner || (isOwner && !existing) ? "super_admin" : tenant.defaultRoleId || "customer";

  const member = await upsertMember(slug, {
    email,
    name: input.name || existing?.member.name || email.split("@")[0],
    password: input.password,
    roleId,
    // "claimed" closes the one-time owner claim hole permanently
    source: canClaimOwner || (isOwner && !existing) ? "claimed" : "signup",
  });

  // Always mirror customers into app CRM (not staff/owner)
  if (roleId === "customer" || (!isOwner && roleId === (tenant.defaultRoleId || "customer"))) {
    try {
      const { upsertCrmContact } = await import("@/lib/app-builder/tenant-store");
      await upsertCrmContact(slug, {
        email: member.email,
        name: member.name,
        source: "signup",
        stage: "new",
      });
    } catch {
      // non-fatal
    }
  }

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

/**
 * After Verlin Labs Google OAuth (same GOOGLE_CLIENT_ID settings),
 * link the Google email into this app's tenant and set the app session cookie.
 */
export async function loginAppWithGoogle(
  slug: string,
  input: { email: string; name?: string | null }
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  let tenant = await getTenant(slug);
  if (!tenant) {
    const project = await getAppProjectBySlug(slug);
    if (project?.status === "live") {
      tenant = await ensureTenantForProject(project);
    }
  }
  if (!tenant) return { ok: false, error: "Shop not found" };

  const email = input.email.toLowerCase().trim();
  if (!email.includes("@")) return { ok: false, error: "Google account has no email" };

  const isOwner = Boolean(tenant.ownerEmail && email === tenant.ownerEmail);
  const existing = await findMember(slug, email);

  // Google sign-in defaults to super_admin so they become admin by default!
  let roleId = "super_admin";

  const member = await upsertMember(slug, {
    email,
    name: input.name?.trim() || existing?.member.name || email.split("@")[0],
    // no password - Google-only member
    roleId,
    source: existing?.member.source === "creator" ? "creator" : "google",
  });

  if (roleId === "customer" || roleId === (tenant.defaultRoleId || "customer")) {
    try {
      const { upsertCrmContact } = await import("@/lib/app-builder/tenant-store");
      await upsertCrmContact(slug, {
        email: member.email,
        name: member.name,
        source: "signup",
        stage: "new",
      });
    } catch {
      // non-fatal
    }
  }

  await setAppSessionCookie(slug, {
    slug,
    email: member.email,
    name: member.name,
    roleId: member.roleId === "super_admin" || isOwner ? "super_admin" : member.roleId,
    memberId: member.id,
  });

  const staff =
    member.roleId === "super_admin" ||
    member.roleId === "admin" ||
    member.roleId === "staff" ||
    isOwner;

  return {
    ok: true,
    redirectTo: staff ? `/apps/${slug}/admin` : `/apps/${slug}`,
  };
}

export function publicSessionView(ctx: AppAuthContext | null) {
  if (!ctx) return null;
  const fullOwner =
    ctx.role.id === "super_admin" ||
    roleHasCapability(ctx.role, "*") ||
    ctx.viaPlatformSuperAdmin === true;
  return {
    email: ctx.session.email,
    name: ctx.session.name,
    roleId: fullOwner ? "super_admin" : ctx.role.id,
    roleLabel: fullOwner ? ctx.role.label || "Owner" : ctx.role.label,
    capabilities: fullOwner ? (["*"] as string[]) : ctx.role.capabilities,
    viaPlatformSuperAdmin: ctx.viaPlatformSuperAdmin === true,
    isStaff:
      fullOwner ||
      roleHasCapability(ctx.role, "orders.manage") ||
      roleHasCapability(ctx.role, "*"),
    isAdmin:
      fullOwner ||
      roleHasCapability(ctx.role, "*") ||
      roleHasCapability(ctx.role, "products.edit") ||
      roleHasCapability(ctx.role, "settings.edit"),
    isOwner: fullOwner || roleHasCapability(ctx.role, "*"),
  };
}
