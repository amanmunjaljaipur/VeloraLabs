import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Consent records for Avatar Studio's two feature-specific consent types.
 * Deliberately NOT part of the site-wide legal/ gate (terms/privacy) -
 * those already apply to every Verlin Labs user on login and are handled by
 * src/lib/legal/. Bundling avatar-specific consent into that global,
 * every-page gate would be wrong: a course-only user should never be asked
 * about voice-cloning consent, and restructuring the site-wide gate's
 * hardcoded 2-doc-type shape (auth.ts, next-auth.d.ts, the JWT/session
 * callbacks, the blocking modal) to fit a 3rd/4th type is a lot of risk on
 * code that gates every single login, for a feature only some users touch.
 *
 * So: ToS/Privacy = existing sitewide gate (unchanged). Voice/Face Cloning
 * Authorization + Model Improvement/Training opt-in = this store, checked
 * only on the Avatar Studio routes that actually need them. Each is
 * explicit, non-bundled, non-pre-checked, versioned, and independently
 * withdrawable, matching the spec's consent requirements.
 */

const CONSENT_FILE = "avatar-consent.json";
const DEFAULT_JSON = "[]";

export type AvatarConsentType = "voice_face_clone" | "training_data";

/** Bump when the consent copy materially changes - withdrawn/never-granted users will be re-prompted at the new version. */
export const AVATAR_CONSENT_VERSIONS: Record<AvatarConsentType, number> = {
  voice_face_clone: 1,
  training_data: 1,
};

export interface AvatarConsentRecord {
  email: string;
  type: AvatarConsentType;
  granted: boolean;
  version: number;
  grantedAt: string | null;
  withdrawnAt: string | null;
  /** IP captured at grant time, if available - some jurisdictions expect this in the consent record. */
  ip: string | null;
}

async function readAll(): Promise<AvatarConsentRecord[]> {
  await ensureDataFileHydrated(CONSENT_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<AvatarConsentRecord[]>(CONSENT_FILE, DEFAULT_JSON);
}

async function writeAll(items: AvatarConsentRecord[]): Promise<void> {
  await writeJsonFileAsync(CONSENT_FILE, items, DEFAULT_JSON);
}

export async function getConsent(email: string, type: AvatarConsentType): Promise<AvatarConsentRecord | null> {
  const all = await readAll();
  return all.find((c) => c.email === email.toLowerCase() && c.type === type) ?? null;
}

export async function getAllConsent(email: string): Promise<AvatarConsentRecord[]> {
  const all = await readAll();
  return all.filter((c) => c.email === email.toLowerCase());
}

/** True only if the user granted this consent AND it's still at (or above) the current required version. */
export async function hasCurrentConsent(email: string, type: AvatarConsentType): Promise<boolean> {
  const record = await getConsent(email, type);
  return Boolean(record?.granted && record.version >= AVATAR_CONSENT_VERSIONS[type]);
}

export async function grantConsent(email: string, type: AvatarConsentType, ip: string | null): Promise<AvatarConsentRecord> {
  const normalizedEmail = email.toLowerCase();
  const all = await readAll();
  const idx = all.findIndex((c) => c.email === normalizedEmail && c.type === type);
  const record: AvatarConsentRecord = {
    email: normalizedEmail,
    type,
    granted: true,
    version: AVATAR_CONSENT_VERSIONS[type],
    grantedAt: new Date().toISOString(),
    withdrawnAt: null,
    ip,
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await writeAll(all);
  return record;
}

/**
 * Withdraws consent going forward. Per the spec's disclosed limitation:
 * this does NOT retroactively remove data already included in a prior
 * daily training batch - only excludes the user from future batches.
 */
export async function withdrawConsent(email: string, type: AvatarConsentType): Promise<AvatarConsentRecord | null> {
  const normalizedEmail = email.toLowerCase();
  const all = await readAll();
  const idx = all.findIndex((c) => c.email === normalizedEmail && c.type === type);
  if (idx < 0) return null;
  all[idx] = { ...all[idx]!, granted: false, withdrawnAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx]!;
}
