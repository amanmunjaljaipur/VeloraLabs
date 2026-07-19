import { readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import type { DemoFooterColumn } from "./types";

export interface DemoAppCustomization {
  name?: string;
  brandName?: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  outcomes?: string[];
  primaryColor?: string;
  accentColor?: string;
  footerColumns?: DemoFooterColumn[];
  entities?: Record<
    string,
    {
      seeds?: any[];
    }
  >;
  screens?: Record<
    string,
    {
      title?: string;
      description?: string;
      imageUrl?: string;
    }
  >;
}

export interface DemoAppsCustomizationsFile {
  version: number;
  updatedAt: string;
  overrides: Record<string, DemoAppCustomization>;
}

const FILE = "demo-apps-customizations.json";
const DEFAULT_CONTENT = '{"version":1,"updatedAt":"","overrides":{}}';

export function readDemoAppCustomizations(): Record<string, DemoAppCustomization> {
  try {
    const data = readJsonFile<DemoAppsCustomizationsFile>(FILE, DEFAULT_CONTENT);
    return data?.overrides || {};
  } catch {
    return {};
  }
}

export async function saveDemoAppCustomization(
  slug: string,
  customization: DemoAppCustomization
): Promise<Record<string, DemoAppCustomization>> {
  const data = readJsonFile<DemoAppsCustomizationsFile>(FILE, DEFAULT_CONTENT) || {
    version: 1,
    updatedAt: "",
    overrides: {},
  };
  
  if (!data.overrides) data.overrides = {};
  data.overrides[slug] = {
    ...data.overrides[slug],
    ...customization,
  };
  data.updatedAt = new Date().toISOString();

  await writeJsonFileAsync(FILE, data, DEFAULT_CONTENT);
  return data.overrides;
}
