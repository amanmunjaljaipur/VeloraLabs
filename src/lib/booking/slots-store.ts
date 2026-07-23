import { randomUUID } from "crypto";
import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";

const SLOTS_FILE = "booking-slot-templates.json";

export type SlotCategory = "free" | "students" | "engineers" | "professionals";

export const SLOT_CATEGORIES: { value: SlotCategory; label: string }[] = [
  { value: "free", label: "Free Session" },
  { value: "students", label: "Students" },
  { value: "engineers", label: "Engineers" },
  { value: "professionals", label: "Professionals" },
];

export interface ManagedSlot {
  id: string;
  category: SlotCategory;
  time: string; // HH:mm, 24h
  capacity: number;
  createdBy?: string;
  createdAt: string;
}

interface SlotTemplateStore {
  version: number;
  updatedAt: string;
  slots: ManagedSlot[];
}

/**
 * Default seed: the original 5-daily-slots pool, tagged "free" - preserves
 * the exact behavior that existed before per-category slots were
 * introduced. Students/Engineers/Professionals pools start empty; a super
 * admin adds slots for them from /admin/bookings/slots. Until they do,
 * getSlotPoolForAudience() falls back to the "free" pool for those
 * categories too, so booking never breaks for a category with no slots yet.
 */
const DEFAULT_FREE_SLOTS: ManagedSlot[] = [
  { id: "s1", category: "free", time: "10:00", capacity: 5, createdAt: new Date(0).toISOString() },
  { id: "s2", category: "free", time: "12:00", capacity: 5, createdAt: new Date(0).toISOString() },
  { id: "s3", category: "free", time: "14:00", capacity: 5, createdAt: new Date(0).toISOString() },
  { id: "s4", category: "free", time: "16:00", capacity: 5, createdAt: new Date(0).toISOString() },
  { id: "s5", category: "free", time: "18:00", capacity: 5, createdAt: new Date(0).toISOString() },
];

const DEFAULT_STORE: SlotTemplateStore = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  slots: DEFAULT_FREE_SLOTS,
};
const DEFAULT_STORE_JSON = JSON.stringify(DEFAULT_STORE);

function readLocal(): SlotTemplateStore {
  const data = readJsonFile<SlotTemplateStore>(SLOTS_FILE, DEFAULT_STORE_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? new Date(0).toISOString(),
    slots: Array.isArray(data.slots) ? data.slots : DEFAULT_FREE_SLOTS,
  };
}

async function readStore(): Promise<SlotTemplateStore> {
  await ensureDataFileHydrated(SLOTS_FILE, DEFAULT_STORE_JSON, { force: true });
  return readLocal();
}

async function writeStore(store: SlotTemplateStore): Promise<void> {
  store.updatedAt = new Date().toISOString();
  await writeJsonFileAsync(SLOTS_FILE, store, DEFAULT_STORE_JSON);
}

/** Every managed slot, across all categories - for the admin slot manager UI. */
export async function listManagedSlots(): Promise<ManagedSlot[]> {
  const store = await readStore();
  return [...store.slots].sort((a, b) =>
    a.category === b.category ? a.time.localeCompare(b.time) : a.category.localeCompare(b.category)
  );
}

/**
 * The slot pool that applies for a given audience category. Falls back to
 * the "free" pool if this category has no slots of its own yet (keeps
 * booking working immediately after this feature ships, before an admin
 * has configured students/engineers/professionals pools).
 */
export async function getSlotPoolForAudience(category: SlotCategory): Promise<ManagedSlot[]> {
  const store = await readStore();
  const own = store.slots.filter((s) => s.category === category);
  if (own.length > 0) return own;
  if (category === "free") return store.slots.filter((s) => s.category === "free");
  return store.slots.filter((s) => s.category === "free");
}

export interface CreateSlotInput {
  category: SlotCategory;
  time: string;
  capacity: number;
  createdBy?: string;
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

export type CreateSlotOutcome =
  | { ok: true; slot: ManagedSlot }
  | { ok: false; error: "invalid_time" | "invalid_capacity" | "duplicate" };

export async function createManagedSlot(input: CreateSlotInput): Promise<CreateSlotOutcome> {
  if (!isValidTime(input.time)) return { ok: false, error: "invalid_time" };
  if (!Number.isFinite(input.capacity) || input.capacity < 1 || input.capacity > 500) {
    return { ok: false, error: "invalid_capacity" };
  }

  const store = await readStore();
  const dupe = store.slots.some((s) => s.category === input.category && s.time === input.time);
  if (dupe) return { ok: false, error: "duplicate" };

  const slot: ManagedSlot = {
    id: `slot-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
    category: input.category,
    time: input.time,
    capacity: Math.round(input.capacity),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  store.slots.push(slot);
  await writeStore(store);
  return { ok: true, slot };
}

export async function updateManagedSlot(
  id: string,
  patch: { time?: string; capacity?: number }
): Promise<CreateSlotOutcome> {
  if (patch.time !== undefined && !isValidTime(patch.time)) {
    return { ok: false, error: "invalid_time" };
  }
  if (
    patch.capacity !== undefined &&
    (!Number.isFinite(patch.capacity) || patch.capacity < 1 || patch.capacity > 500)
  ) {
    return { ok: false, error: "invalid_capacity" };
  }

  const store = await readStore();
  const slot = store.slots.find((s) => s.id === id);
  if (!slot) return { ok: false, error: "invalid_time" };

  if (patch.time !== undefined) slot.time = patch.time;
  if (patch.capacity !== undefined) slot.capacity = Math.round(patch.capacity);

  await writeStore(store);
  return { ok: true, slot };
}

export async function deleteManagedSlot(id: string): Promise<boolean> {
  const store = await readStore();
  const before = store.slots.length;
  store.slots = store.slots.filter((s) => s.id !== id);
  if (store.slots.length === before) return false;
  await writeStore(store);
  return true;
}
