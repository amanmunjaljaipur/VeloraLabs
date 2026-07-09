import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type { AppBuilderStore, AppProject } from "@/lib/app-builder/types";
import { slugifyAppName } from "@/lib/app-builder/extensions";

const FILE = "app-builder-projects.json";

const EMPTY: AppBuilderStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  projects: [],
};

export function readAppBuilderStore(): AppBuilderStore {
  const data = readJsonFile<AppBuilderStore>(FILE, JSON.stringify(EMPTY));
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    projects: Array.isArray(data.projects) ? data.projects : [],
  };
}

export function writeAppBuilderStore(store: AppBuilderStore): void {
  writeJsonFile(FILE, { ...store, updatedAt: new Date().toISOString() });
}

export function listAppProjects(): AppProject[] {
  return [...readAppBuilderStore().projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getAppProject(id: string): AppProject | undefined {
  return readAppBuilderStore().projects.find((p) => p.id === id);
}

export function getAppProjectBySlug(slug: string): AppProject | undefined {
  return readAppBuilderStore().projects.find((p) => p.slug === slug);
}

export function uniqueAppSlug(base: string): string {
  const store = readAppBuilderStore();
  let slug = slugifyAppName(base) || `app-${Date.now().toString(36)}`;
  let n = 1;
  const taken = new Set(store.projects.map((p) => p.slug));
  while (taken.has(slug)) {
    slug = `${slugifyAppName(base)}-${n++}`;
  }
  return slug;
}

export function saveAppProject(project: AppProject): AppProject {
  const store = readAppBuilderStore();
  const idx = store.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) store.projects[idx] = project;
  else store.projects.unshift(project);
  writeAppBuilderStore(store);
  return project;
}

export function deleteAppProject(id: string): boolean {
  const store = readAppBuilderStore();
  const next = store.projects.filter((p) => p.id !== id);
  if (next.length === store.projects.length) return false;
  store.projects = next;
  writeAppBuilderStore(store);
  return true;
}
