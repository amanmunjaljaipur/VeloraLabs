"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { VerlinLogo } from "@/components/ui/VerlinLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { isNavLinkActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const MY_COURSE_NAV = { label: "My Course", href: "/my-course" };

interface NavbarProps {
  nav: { label: string; href: string }[];
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
        "group relative whitespace-nowrap text-sm font-medium tracking-tight transition-colors duration-150",
        active ? "text-teal" : "text-foreground/70 hover:text-foreground"
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 rounded-full bg-accent-teal transition-all duration-150 ease-out",
          active ? "w-full" : "w-0 group-hover:w-full"
        )}
        aria-hidden="true"
      />
    </Link>
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
  const navItems = [...learnerNav, ...baseNav];

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
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200 ease-out",
          scrolled
            ? "border-b border-border/80 bg-[var(--canvas)]/95 shadow-sm backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-[var(--canvas)]/90 backdrop-blur-md"
        )}
      >
        <nav
          className="container-verlin-nav flex h-14 items-center gap-3 md:h-16 lg:gap-5"
          aria-label="Main navigation"
        >
          <VerlinLogo className="mr-1 shrink-0 sm:mr-2" />

          <div className="hidden flex-1 items-center justify-center gap-x-4 overflow-x-auto scrollbar-hide lg:flex xl:gap-x-6 2xl:gap-x-7">
            {navItems.map((item) =>
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
              className="fixed inset-x-0 top-16 z-[70] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background shadow-xl lg:hidden md:top-[4.25rem] md:max-h-[calc(100dvh-4.25rem)]"
            >
              <div className="container-verlin-nav flex flex-col gap-1 py-4">
                {navItems.map((item) =>
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
                <div className="mt-3 border-t border-border pt-4">
                  <AuthButton className="w-full justify-center" />
                </div>
                {!isEnrolled && (
                  <Link href="/free-session" className="mt-3 block" onClick={closeMobile}>
                    <Button variant="cta" className="w-full">
                      Book Free Session
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}