import { getXmlSitemapEntries } from "@/lib/site-sitemap";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return getXmlSitemapEntries();
}