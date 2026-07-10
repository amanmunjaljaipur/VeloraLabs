/**
 * Server registry for published demo stores (Blob-backed via data-store).
 */

import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import type { DemoStore, DemoStoreRegistry } from "./types";

const FILE = "demo-published-stores.json";

const EMPTY: DemoStoreRegistry = {
  version: 1,
  updatedAt: new Date().toISOString(),
  stores: [],
};

const EMPTY_JSON = JSON.stringify(EMPTY);

export async function loadStoreRegistry(): Promise<DemoStoreRegistry> {
  await ensureDataFileHydrated(FILE, EMPTY_JSON, { force: true });
  const data = readJsonFile<DemoStoreRegistry>(FILE, EMPTY_JSON);
  return {
    version: 1,
    updatedAt: data.updatedAt || new Date().toISOString(),
    stores: Array.isArray(data.stores) ? data.stores : [],
  };
}

export async function saveStoreRegistry(reg: DemoStoreRegistry): Promise<void> {
  const next: DemoStoreRegistry = {
    version: 1,
    updatedAt: new Date().toISOString(),
    stores: reg.stores,
  };
  await writeJsonFileAsync(FILE, next, EMPTY_JSON);
}

export async function upsertPublishedStore(store: DemoStore): Promise<DemoStore> {
  const reg = await loadStoreRegistry();
  const published: DemoStore = {
    ...store,
    published: true,
    updatedAt: new Date().toISOString(),
  };
  const idx = reg.stores.findIndex((s) => s.id === published.id);
  if (idx >= 0) reg.stores[idx] = published;
  else reg.stores.push(published);
  await saveStoreRegistry(reg);
  return published;
}

export async function getPublishedStore(id: string): Promise<DemoStore | null> {
  const reg = await loadStoreRegistry();
  return reg.stores.find((s) => s.id === id && s.published) || null;
}

export async function listPublishedStores(): Promise<DemoStore[]> {
  const reg = await loadStoreRegistry();
  return reg.stores.filter((s) => s.published);
}
