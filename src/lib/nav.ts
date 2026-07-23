/** Map nav hrefs to route prefixes that should keep that link active. */
const NAV_ACTIVE_PREFIXES: Record<string, string[]> = {
  "/free-session": ["/free-session"],
  "/courses": ["/courses"],
  "/pricing": ["/pricing"],
  "/products": ["/products"],
  "/corporate": ["/corporate"],
  "/library": ["/library"],
  "/mental-models": ["/mental-models"],
  "/about": ["/about"],
  "/faq": ["/faq"],
  "/contact": ["/contact"],
  "/blog": ["/blog"],
  "/resources": ["/resources"],
  "/my-course": ["/my-course", "/sessions"],
};

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href.startsWith("http")) return false;
  if (pathname === href) return true;

  const prefixes = NAV_ACTIVE_PREFIXES[href];
  if (prefixes) {
    return prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  return pathname.startsWith(`${href}/`);
}