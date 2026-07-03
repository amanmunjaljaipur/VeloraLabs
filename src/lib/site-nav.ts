export interface SiteNavLink {
  label: string;
  href: string;
}

/** Footer-only pages that supplement the header nav (not duplicated in header). */
const FOOTER_EXTRA_LINKS: SiteNavLink[] = [
  { label: "Resources", href: "/resources" },
];

const INSERT_EXTRAS_BEFORE = "/contact";

/**
 * Build footer Explore links from header nav so labels and routes stay in sync.
 * Inserts supplementary links (e.g. Resources) before Contact.
 */
export function buildFooterExploreLinks(
  headerNav: SiteNavLink[],
  extraLinks: SiteNavLink[] = FOOTER_EXTRA_LINKS
): SiteNavLink[] {
  const seen = new Set<string>();
  const extras = extraLinks.filter((link) => {
    if (headerNav.some((item) => item.href === link.href)) return false;
    return true;
  });

  const result: SiteNavLink[] = [];

  for (const link of headerNav) {
    if (link.href === INSERT_EXTRAS_BEFORE) {
      for (const extra of extras) {
        if (!seen.has(extra.href)) {
          result.push(extra);
          seen.add(extra.href);
        }
      }
    }
    if (!seen.has(link.href)) {
      result.push(link);
      seen.add(link.href);
    }
  }

  for (const extra of extras) {
    if (!seen.has(extra.href)) {
      result.push(extra);
      seen.add(extra.href);
    }
  }

  return result;
}