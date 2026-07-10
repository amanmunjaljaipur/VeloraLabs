import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import type { AppBuilderStore, AppProject } from "@/lib/app-builder/types";
import { slugifyAppName } from "@/lib/app-builder/extensions";

const FILE = "app-builder-projects.json";

const EMPTY: AppBuilderStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  projects: [],
};

const EMPTY_JSON = JSON.stringify(EMPTY);

let loadPromise: Promise<void> | null = null;
let cache: AppBuilderStore | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 3_000;

function readLocal(): AppBuilderStore {
  const data = readJsonFile<AppBuilderStore>(FILE, EMPTY_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    projects: Array.isArray(data.projects) ? data.projects : [],
  };
}

/**
 * Always hydrate from Blob (force) on Vercel before reading.
 * Prevents empty /tmp seeds from wiping published shops on navigation.
 */
export async function ensureAppBuilderLoaded(force = false): Promise<AppBuilderStore> {
  if (!force && cache && Date.now() - cacheAt < CACHE_TTL_MS) {
    return cache;
  }

  if (loadPromise) {
    await loadPromise;
    return cache ?? readLocal();
  }

  loadPromise = (async () => {
    await ensureDataFileHydrated(FILE, EMPTY_JSON, { force: true });
    cache = readLocal();
    cacheAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }

  return cache ?? readLocal();
}

export async function writeAppBuilderStore(store: AppBuilderStore): Promise<void> {
  const next = { ...store, updatedAt: new Date().toISOString() };
  // Await Blob upload so other serverless instances see the app immediately
  await writeJsonFileAsync(FILE, next, EMPTY_JSON);
  cache = next;
  cacheAt = Date.now();
}

export async function listAppProjects(): Promise<AppProject[]> {
  const store = await ensureAppBuilderLoaded();
  return [...store.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getAppProject(id: string): Promise<AppProject | undefined> {
  const store = await ensureAppBuilderLoaded();
  return store.projects.find((p) => p.id === id);
}

export async function getAppProjectBySlug(slug: string): Promise<AppProject | undefined> {
  const store = await ensureAppBuilderLoaded(true);
  return store.projects.find((p) => p.slug === slug);
}

export async function uniqueAppSlug(base: string): Promise<string> {
  const store = await ensureAppBuilderLoaded();
  let slug = slugifyAppName(base) || `app-${Date.now().toString(36)}`;
  let n = 1;
  const taken = new Set(store.projects.map((p) => p.slug));
  while (taken.has(slug)) {
    slug = `${slugifyAppName(base)}-${n++}`;
  }
  return slug;
}

export async function saveAppProject(project: AppProject): Promise<AppProject> {
  const store = await ensureAppBuilderLoaded(true);
  const idx = store.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) store.projects[idx] = project;
  else store.projects.unshift(project);
  await writeAppBuilderStore(store);
  return project;
}

export async function deleteAppProject(id: string): Promise<boolean> {
  const store = await ensureAppBuilderLoaded(true);
  const next = store.projects.filter((p) => p.id !== id);
  if (next.length === store.projects.length) return false;
  store.projects = next;
  await writeAppBuilderStore(store);
  return true;
}

/** Sync fallback for rare non-async call sites — prefer async APIs. */
export function listAppProjectsSync(): AppProject[] {
  return [...readLocal().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
