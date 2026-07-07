import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type { CmsContentType, CmsPageDefinition } from "@/lib/cms/registry";
import { randomUUID } from "crypto";

const REGISTRY_FILE = "cms-custom-registry.json";

export interface CustomCmsPageRecord extends CmsPageDefinition {
  type: "rich";
  createdAt: string;
  updatedAt: string;
}

interface CustomRegistry {
  pages: CustomCmsPageRecord[];
}

const EMPTY: CustomRegistry = { pages: [] };

function readRegistry(): CustomRegistry {
  return readJsonFile<CustomRegistry>(REGISTRY_FILE, JSON.stringify(EMPTY));
}

function writeRegistry(registry: CustomRegistry): void {
  writeJsonFile(REGISTRY_FILE, registry, JSON.stringify(EMPTY));
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function listCustomCmsPages(): CustomCmsPageRecord[] {
  return readRegistry().pages;
}

export function getCustomCmsPage(id: string): CustomCmsPageRecord | undefined {
  return readRegistry().pages.find((page) => page.id === id);
}

export function getCustomCmsPageByPath(path: string): CustomCmsPageRecord | undefined {
  const normalized = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  return readRegistry().pages.find((page) => page.publicPath === normalized);
}

export function createCustomCmsPage(input: {
  label: string;
  description?: string;
  publicPath: string;
  group?: string;
}): CustomCmsPageRecord {
  const registry = readRegistry();
  const label = input.label.trim();
  const publicPath = normalizePublicPath(input.publicPath);

  if (!label) throw new Error("Page title is required");
  if (!publicPath.startsWith("/")) throw new Error("URL must start with /");

  if (registry.pages.some((page) => page.publicPath === publicPath)) {
    throw new Error("A page with this URL already exists");
  }

  const id = `custom-${slugify(label) || randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const page: CustomCmsPageRecord = {
    id,
    label,
    description: input.description?.trim() || "Custom page",
    group: input.group?.trim() || "Custom Pages",
    filename: `cms-page-${id}.json`,
    type: "rich",
    publicPath,
    createdAt: now,
    updatedAt: now,
  };

  registry.pages.push(page);
  writeRegistry(registry);
  return page;
}

export function updateCustomCmsPageMeta(
  id: string,
  patch: { label?: string; description?: string; publicPath?: string; group?: string }
): CustomCmsPageRecord | null {
  const registry = readRegistry();
  const page = registry.pages.find((item) => item.id === id);
  if (!page) return null;

  if (patch.label?.trim()) page.label = patch.label.trim();
  if (patch.description !== undefined) page.description = patch.description.trim();
  if (patch.group?.trim()) page.group = patch.group.trim();
  if (patch.publicPath) {
    const publicPath = normalizePublicPath(patch.publicPath);
    if (registry.pages.some((item) => item.id !== id && item.publicPath === publicPath)) {
      throw new Error("A page with this URL already exists");
    }
    page.publicPath = publicPath;
  }
  page.updatedAt = new Date().toISOString();
  writeRegistry(registry);
  return page;
}

export function deleteCustomCmsPage(id: string): boolean {
  const registry = readRegistry();
  const next = registry.pages.filter((page) => page.id !== id);
  if (next.length === registry.pages.length) return false;
  registry.pages = next;
  writeRegistry(registry);
  return true;
}

function normalizePublicPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  if (trimmed.length > 1 && trimmed.endsWith("/")) return trimmed.slice(0, -1);
  return trimmed;
}

export function isRichPageType(type: CmsContentType | "rich"): boolean {
  return type === "markdown" || type === "rich";
}