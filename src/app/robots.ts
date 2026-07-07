import { SITE_ORIGIN } from "@/lib/site-sitemap";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/my-course", "/sessions/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}