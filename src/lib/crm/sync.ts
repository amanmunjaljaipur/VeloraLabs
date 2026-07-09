import { ensureKnownUsersLoaded } from "@/lib/known-users";
import { readJsonFile } from "@/lib/data-store";
import { ensureRolesLoaded, getRoleForEmail } from "@/lib/roles";
import { archiveLeadByEmail, readCrmStore, setLastSyncedAt, upsertLead } from "@/lib/crm/store";
import type { CrmStage } from "@/lib/crm/types";

export async function syncCrmFromSources(): Promise<{
  imported: { bookings: number; contacts: number; subscribers: number; people: number };
}> {
  const counts = { bookings: 0, contacts: 0, subscribers: 0, people: 0 };

  const localSubs = readJsonFile<{ subscribers: Record<string, { email: string; source: string }> }>(
    "newsletter-subscribers.json",
    '{"subscribers":{}}'
  );
  for (const sub of Object.values(localSubs.subscribers)) {
    upsertLead({
      name: sub.email.split("@")[0] ?? sub.email,
      email: sub.email,
      source: "newsletter",
      isSubscriber: true,
    });
    counts.subscribers += 1;
  }

  await ensureKnownUsersLoaded();
  await ensureRolesLoaded();

  const knownUsers = readJsonFile<
    Record<string, { email: string; name: string | null; provider: string }>
  >("known-users.json", "{}");

  for (const user of Object.values(knownUsers)) {
    const role = getRoleForEmail(user.email);
    upsertLead({
      name: user.name ?? user.email.split("@")[0] ?? user.email,
      email: user.email,
      source: "known_user",
      stage:
        role === "student" || role === "engineer" || role === "professional"
          ? "enrolled"
          : "contacted",
      learnerRole: role ?? undefined,
    });
    counts.people += 1;
  }

  archiveLeadByEmail("qa.test.lead@example.com", "system");
  setLastSyncedAt(new Date().toISOString());
  return { imported: counts };
}

const DEFAULT_SYNC_MAX_AGE_MS = 5 * 60 * 1000;

export async function ensureCrmSynced(maxAgeMs = DEFAULT_SYNC_MAX_AGE_MS): Promise<boolean> {
  const store = readCrmStore();
  if (store.lastSyncedAt) {
    const age = Date.now() - new Date(store.lastSyncedAt).getTime();
    if (age < maxAgeMs) return false;
  }
  await syncCrmFromSources();
  return true;
}