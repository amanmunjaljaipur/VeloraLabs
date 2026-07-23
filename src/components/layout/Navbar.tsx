"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { VerlinLogo } from "@/components/ui/VerlinLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { isNavLinkActive } from "@/lib/nav";
import type { HeaderNavLink } from "@/lib/site-sitemap";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const MY_COURSE_NAV = { label: "My Course", href: "/my-course" };

interface NavbarProps {
  nav: HeaderNavLink[];
}

function isExternal(href: string) {
  return href.startsWith("http");
}

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer whitespace-nowrap text-sm font-medium tracking-tight",
        "transition-colors duration-200 ease-out",
        active ? "text-teal" : "text-foreground/70 hover:text-foreground"
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 rounded-full bg-accent-teal",
          "transition-[width] duration-200 ease-out",
          active ? "w-full" : "w-0 group-hover:w-full"
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

/** Desktop dropdown - groups Product Offerings and Learning Content separately. */
function NavDropdown({
  label,
  items,
  isActive,
}: {
  label: string;
  items: HeaderNavLink[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "group inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-sm font-medium tracking-tight",
          "transition-colors duration-200 ease-out",
          isActive ? "text-teal" : "text-foreground/70 hover:text-foreground"
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: DURATION.menu, ease: EASE_OUT }}
            className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-[var(--canvas)] shadow-lg"
          >
            <ul className="py-1.5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar({ nav }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const isEnrolled = session?.user?.enrolledLearner ?? false;
  const baseNav = isEnrolled ? nav.filter((item) => item.href !== "/free-session") : nav;
  const learnerNav = isEnrolled ? [MY_COURSE_NAV] : [];

  // Group into Products / Learn dropdowns; everything else stays flat.
  const productItems = baseNav.filter((item) => item.navGroup === "products");
  const learnItems = baseNav.filter((item) => item.navGroup === "learn");
  const flatItems = [...learnerNav, ...baseNav.filter((item) => !item.navGroup)];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => isNavLinkActive(pathname, href);
  const isGroupActive = (items: HeaderNavLink[]) => items.some((item) => isActive(item.href));
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200 ease-out",
          scrolled
            ? "border-b border-border/80 bg-[var(--canvas)]/95 shadow-sm backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-border/50 bg-[var(--canvas)]/90 backdrop-blur-md"
        )}
      >
        <nav
          className="container-verlin-nav flex h-14 items-center gap-3 md:h-16 lg:gap-5"
          aria-label="Main navigation"
        >
          <VerlinLogo className="mr-1 shrink-0 sm:mr-2" />

          {/* No overflow-x-auto here: per CSS spec, setting overflow-x on an
              axis forces the other axis to compute as "auto" too, which
              clips the absolutely-positioned dropdown panels below this row
              (they'd render, just invisibly clipped). Nav is compact enough
              now (2 dropdowns + a few flat links) that horizontal scroll
              isn't needed at the lg+ breakpoint this row appears at. */}
          <div className="hidden min-w-0 flex-1 items-center justify-start gap-x-3 lg:flex xl:gap-x-5 2xl:gap-x-6">
            {productItems.length > 0 && (
              <NavDropdown label="Products" items={productItems} isActive={isGroupActive(productItems)} />
            )}
            {learnItems.length > 0 && (
              <NavDropdown label="Learning" items={learnItems} isActive={isGroupActive(learnItems)} />
            )}
            {flatItems.map((item) =>
              isExternal(item.href) ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-foreground/75 transition-colors duration-150 hover:text-foreground"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
                </a>
              ) : (
                <NavLink key={item.href} href={item.href} active={isActive(item.href)}>
                  {item.label}
                </NavLink>
              )
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-3">
            <ThemeToggle />
            <div className="hidden sm:block xl:hidden">
              <AuthButton compact />
            </div>
            <div className="hidden xl:block">
              <AuthButton />
            </div>
            {!isEnrolled && (
              <>
                <Link href="/free-session" className="hidden lg:block xl:hidden">
                  <Button variant="cta" size="sm" className="whitespace-nowrap px-4">
                    Book Free
                  </Button>
                </Link>
                <Link href="/free-session" className="hidden xl:block">
                  <Button variant="cta" size="sm" className="whitespace-nowrap">
                    Book Free Session
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              className="rounded-xl p-2 text-foreground/80 transition-colors hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: DURATION.menu, ease: EASE_OUT }}
              className="fixed inset-0 z-[60] bg-navy/40 backdrop-blur-[2px] lg:hidden"
              aria-label="Close menu"
              onClick={closeMobile}
            />
            <motion.div
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={reduceMotion ? false : { opacity: 0, y: -16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: DURATION.menu, ease: EASE_OUT }}
              className="fixed inset-x-0 top-14 z-[70] max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background shadow-xl lg:hidden md:top-16 md:max-h-[calc(100dvh-4rem)]"
            >
              <div className="container-verlin-nav flex flex-col gap-1 py-4">
                {flatItems.map((item) =>
                  isExternal(item.href) ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl px-3 py-3.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      onClick={closeMobile}
                    >
                      {item.label}
                      <ExternalLink className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-xl px-3 py-3.5 text-sm font-medium transition-colors hover:bg-muted",
                        isActive(item.href)
                          ? "bg-accent-teal/10 text-accent-teal"
                          : "text-foreground/80 hover:text-foreground"
                      )}
                      onClick={closeMobile}
                    >
                      {item.label}
                    </Link>
                  )
                )}

                {productItems.length > 0 && (
                  <div className="mt-2 border-t border-border pt-3">
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Products
                    </p>
                    {productItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "block rounded-xl px-3 py-3.5 text-sm font-medium transition-colors hover:bg-muted",
                          isActive(item.href)
                            ? "bg-accent-teal/10 text-accent-teal"
                            : "text-foreground/80 hover:text-foreground"
                        )}
                        onClick={closeMobile}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                {learnItems.length > 0 && (
                  <div className="mt-2 border-t border-border pt-3">
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Learning
                    </p>
                    {learnItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "block rounded-xl px-3 py-3.5 text-sm font-medium transition-colors hover:bg-muted",
                          isActive(item.href)
                            ? "bg-accent-teal/10 text-accent-teal"
                            : "text-foreground/80 hover:text-foreground"
                        )}
                        onClick={closeMobile}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
                  <AuthButton className="w-full justify-center" />
                  {!isEnrolled && (
                    <Link href="/free-session" className="block w-full" onClick={closeMobile}>
                      <Button variant="cta" className="w-full justify-center">
                        Book Free Session
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
