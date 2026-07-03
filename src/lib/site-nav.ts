export interface SiteNavLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: SiteNavLink[];
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

const FOOTER_GROUP_ORDER: { title: string; hrefs: string[] }[] = [
  {
    title: "Learn",
    hrefs: [
      "/free-session",
      "/courses",
      "/library",
      "/blog",
      "/mental-models",
      "/resources",
    ],
  },
  {
    title: "Company",
    hrefs: ["/about", "/faq", "/contact"],
  },
];

/** Group footer links into scannable columns (industry-standard sitemap layout). */
export function buildFooterLinkGroups(
  headerNav: SiteNavLink[],
  extraLinks: SiteNavLink[] = FOOTER_EXTRA_LINKS
): FooterLinkGroup[] {
  const allLinks = buildFooterExploreLinks(headerNav, extraLinks);
  const linkMap = new Map(allLinks.map((link) => [link.href, link]));

  const pick = (hrefs: string[]) =>
    hrefs
      .map((href) => linkMap.get(href))
      .filter((link): link is SiteNavLink => Boolean(link));

  return FOOTER_GROUP_ORDER.map((group) => ({
    title: group.title,
    links: pick(group.hrefs),
  })).filter((group) => group.links.length > 0);
}