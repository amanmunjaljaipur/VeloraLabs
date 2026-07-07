import type { HomeContentData } from "@/lib/cms/home-content-types";
import { readCmsJson } from "@/lib/cms/store";

export type { HomeContentData } from "@/lib/cms/home-content-types";

export function getHomeContentData(): HomeContentData {
  return readCmsJson<HomeContentData>("home-content.json");
}