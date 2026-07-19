/**
 * Per-demo-app auth (client-only).
 * Each slug is an isolated tenant: users + session never cross apps.
 * Signup creates an app admin who can switch every product role for testing.
 */

export type DemoAppUser = {
  id: string;
  email: string;
  name: string;
  /** bcrypt-like not needed - demo sandboxes only; stored as simple hash */
  passwordHash: string;
  /** app_admin can use all product roles; member is locked to default */
  access: "app_admin" | "member";
  createdAt: string;
};

export type DemoAppSession = {
  userId: string;
  email: string;
  name: string;
  access: "app_admin" | "member";
  slug: string;
  /** ISO */
  expiresAt: string;
};

const USERS_KEY = (slug: string) => `vl-demo-users:v1:${slug}`;
const SESSION_KEY = (slug: string) => `vl-demo-session:v1:${slug}`;

const SESSION_DAYS = 30;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Lightweight non-crypto hash for demo passwords (not for production secrets). */
export function hashDemoPassword(password: string): string {
  let h = 2166136261;
  const s = `vl-demo|${password}|v1`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

function readUsers(slug: string): DemoAppUser[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoAppUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(slug: string, users: DemoAppUser[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(USERS_KEY(slug), JSON.stringify(users));
}

export function getDemoSession(slug: string): DemoAppSession | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY(slug));
    if (!raw) return null;
    const session = JSON.parse(raw) as DemoAppSession;
    if (!session?.userId || session.slug !== slug) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(SESSION_KEY(slug));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(session: DemoAppSession) {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_KEY(session.slug), JSON.stringify(session));
}

function makeSession(
  slug: string,
  user: DemoAppUser,
  days = SESSION_DAYS
): DemoAppSession {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    access: user.access,
    slug,
    expiresAt: expires.toISOString(),
  };
}

export type DemoAuthResult =
  | { ok: true; session: DemoAppSession }
  | { ok: false; error: string };

export function signupDemoUser(
  slug: string,
  input: { name: string; email: string; password: string; asAdmin?: boolean }
): DemoAuthResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) return { ok: false, error: "Enter your full name (min 2 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = readUsers(slug);
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists. Log in instead." };
  }

  // First user on an app is always admin; later signups default to admin for demo testing
  // (product demos need multi-role access). Optional member path kept for realism.
  const isFirst = users.length === 0;
  const user: DemoAppUser = {
    id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    name,
    passwordHash: hashDemoPassword(password),
    access: input.asAdmin === false && !isFirst ? "member" : "app_admin",
    createdAt: new Date().toISOString(),
  };
  writeUsers(slug, [...users, user]);
  const session = makeSession(slug, user);
  writeSession(session);
  return { ok: true, session };
}

export function loginDemoUser(
  slug: string,
  input: { email: string; password: string }
): DemoAuthResult {
  const email = input.email.trim().toLowerCase();
  const users = readUsers(slug);
  const user = users.find((u) => u.email === email);
  if (!user) return { ok: false, error: "No account found for this email. Sign up first." };
  if (user.passwordHash !== hashDemoPassword(input.password)) {
    return { ok: false, error: "Incorrect password." };
  }
  const session = makeSession(slug, user);
  writeSession(session);
  return { ok: true, session };
}

export function logoutDemoUser(slug: string) {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_KEY(slug));
}

export function elevateToAdmin(slug: string): DemoAuthResult {
  const session = getDemoSession(slug);
  if (!session) return { ok: false, error: "Not logged in." };
  const users = readUsers(slug);
  const idx = users.findIndex((u) => u.id === session.userId);
  if (idx < 0) return { ok: false, error: "User not found." };
  users[idx] = { ...users[idx], access: "app_admin" };
  writeUsers(slug, users);
  const next = makeSession(slug, users[idx]);
  writeSession(next);
  return { ok: true, session: next };
}

export function countDemoUsers(slug: string): number {
  return readUsers(slug).length;
}
