"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { VerlinLogo } from "@/components/ui/VerlinLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MY_COURSE_NAV = { label: "My Course", href: "/my-course" };

interface NavbarProps {
  nav: { label: string; href: string }[];
}

function isExternal(href: string) {
  return href.startsWith("http");
}

export function Navbar({ nav }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  const isActive = (href: string) => !isExternal(href) && pathname === href;

  const linkClass = (href: string) =>
    cn(
      "relative whitespace-nowrap text-sm font-medium transition-colors",
      isActive(href)
        ? "text-accent-teal"
        : "text-text-secondary hover:text-navy dark:hover:text-foreground"
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-background/90 backdrop-blur-sm"
      )}
    >
      <nav
        className="container-verlin flex h-16 items-center gap-4 md:h-[4.25rem] md:gap-6"
        aria-label="Main navigation"
      >
        <VerlinLogo />

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-x-8 lg:flex">
          {navItems.map((item) =>
            isExternal(item.href) ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkClass(item.href), "inline-flex items-center gap-1")}
              >
                {item.label}
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={cn(linkClass(item.href), "relative")}>
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-accent-teal" />
                )}
              </Link>
            )
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <AuthButton />
          </div>
          {!isEnrolled && (
            <Link href="/free-session" className="hidden md:block">
              <Button variant="cta" size="sm" className="whitespace-nowrap shadow-md">
                Book Free 2-Hour Session
              </Button>
            </Link>
          )}
          <button
            type="button"
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-navy/20 backdrop-blur-[2px] lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 border-b border-border bg-background px-4 py-5 shadow-lg lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) =>
                isExternal(item.href) ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-muted hover:text-navy"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted",
                      isActive(item.href)
                        ? "bg-accent-teal/10 text-accent-teal"
                        : "text-text-secondary hover:text-navy"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="mt-2 border-t border-border pt-4">
                <AuthButton className="w-full justify-center" />
              </div>
              {!isEnrolled && (
                <Link
                  href="/free-session"
                  className="mt-3 block"
                  onClick={() => setMobileOpen(false)}
                >
                  <Button variant="cta" className="w-full">
                    Book Free 2-Hour Session
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}