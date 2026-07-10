/**
 * Client-side store registry + helpers.
 * Server Blob sync via /api/demo-stores for permanent public URLs.
 */

import {
  CATEGORY_OPTIONS,
  DEFAULT_THEME,
  defaultChatbot,
  defaultCms,
  slugifyStoreId,
  type DemoStore,
  type StoreCategoryId,
} from "./types";

const LOCAL_KEY = "vl-demo-stores:v1";
const OWNER_INDEX = "vl-demo-stores-by-owner:v1";

function canStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function listLocalStores(): DemoStore[] {
  if (!canStorage()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const stores = JSON.parse(raw) as DemoStore[];
    return Array.isArray(stores) ? stores : [];
  } catch {
    return [];
  }
}

function writeLocal(stores: DemoStore[]) {
  if (!canStorage()) return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(stores));
}

export function getLocalStore(id: string): DemoStore | null {
  return listLocalStores().find((s) => s.id === id) || null;
}

export function listStoresForOwner(email: string): DemoStore[] {
  const e = email.trim().toLowerCase();
  return listLocalStores().filter((s) => s.ownerEmail.toLowerCase() === e);
}

export function nextStoreId(categoryId: StoreCategoryId, _brandName: string): string {
  const opt = CATEGORY_OPTIONS.find((c) => c.id === categoryId);
  const prefix = opt?.prefix || "app";
  const existing = listLocalStores().map((s) => s.id);
  let n = 1;
  // Permanent extension style: ecom-food_1 , ecom_2 , fin-bank_1
  let id = `${prefix}_${n}`;
  while (existing.includes(id)) {
    n++;
    id = `${prefix}_${n}`;
  }
  return id;
}

export function createStoreDraft(input: {
  categoryId: StoreCategoryId;
  brandName: string;
  tagline?: string;
  ownerEmail: string;
  ownerName: string;
  sourceDemoSlug?: string;
  theme?: Partial<DemoStore["theme"]>;
  logoDataUrl?: string;
}): DemoStore {
  const brandName = input.brandName.trim() || "My Store";
  const id = nextStoreId(input.categoryId, brandName);
  const now = new Date().toISOString();
  return {
    id,
    extension: id,
    categoryId: input.categoryId,
    brandName,
    tagline: input.tagline?.trim() || "Your store on Horizon",
    logoDataUrl: input.logoDataUrl,
    theme: { ...DEFAULT_THEME, ...input.theme },
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    ownerName: input.ownerName.trim(),
    sourceDemoSlug: input.sourceDemoSlug,
    published: false,
    cms: defaultCms(brandName),
    crm: [],
    chatbot: defaultChatbot(brandName),
    products: [],
    visits: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function saveLocalStore(store: DemoStore): DemoStore {
  const next = { ...store, updatedAt: new Date().toISOString() };
  const all = listLocalStores();
  const idx = all.findIndex((s) => s.id === next.id);
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeLocal(all);
  return next;
}

export function deleteLocalStore(id: string) {
  writeLocal(listLocalStores().filter((s) => s.id !== id));
}

export async function publishStoreToServer(store: DemoStore): Promise<{
  ok: boolean;
  store?: DemoStore;
  error?: string;
}> {
  const published: DemoStore = {
    ...store,
    published: true,
    updatedAt: new Date().toISOString(),
  };
  saveLocalStore(published);
  try {
    const res = await fetch("/api/demo-stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: published }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; store?: DemoStore };
    if (!res.ok) {
      return { ok: true, store: published, error: data.error || "Saved locally; server sync failed" };
    }
    if (data.store) saveLocalStore(data.store);
    return { ok: true, store: data.store || published };
  } catch {
    return { ok: true, store: published, error: "Saved locally; offline server sync" };
  }
}

export async function fetchPublishedStore(id: string): Promise<DemoStore | null> {
  try {
    const res = await fetch(`/api/demo-stores?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { store?: DemoStore };
      if (data.store) {
        // cache locally for offline
        const all = listLocalStores();
        if (!all.some((s) => s.id === data.store!.id)) {
          saveLocalStore(data.store);
        }
        return data.store;
      }
    }
  } catch {
    /* fall through */
  }
  const local = getLocalStore(id);
  return local?.published ? local : local;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
