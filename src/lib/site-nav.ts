/** @deprecated Import from `@/lib/site-sitemap` — this module re-exports for backwards compatibility. */
export type { FooterLinkGroup, SitemapSection } from "./site-sitemap";
export {
  buildFooterLinkGroups,
  buildSitemapSections,
  getHeaderNavLinks,
  getSitemapPage,
  getSitemapSectionLinks,
} from "./site-sitemap";

export interface SiteNavLink {
  label: string;
  href: string;
}