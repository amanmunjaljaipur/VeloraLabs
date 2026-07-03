"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { VerlinLogo } from "@/components/ui/VerlinLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MY_COURSE_NAV = { label: "My Course", href: "/my-course" };
const ADMIN_PANEL_NAV = { label: "Admin Panel", href: "/admin/role-assignment" };
const ADMIN_SESSIONS_NAV = { label: "Session Videos", href: "/admin/sessions" };

interface NavbarProps {
  nav: { label: string; href: string }[];
}

function isExternal(href: string) {
  return href.startsWith("http");
}

export function Navbar({ nav }: NavbarProps) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const role = session?.user?.role;
  const isEnrolled = session?.user?.enrolledLearner ?? false;
  const isAdmin = role === "admin" || role === "super_admin";
  const adminNav = [...(isAdmin ? [ADMIN_PANEL_NAV, ADMIN_SESSIONS_NAV] : [])];
  const baseNav = isEnrolled ? nav.filter((item) => item.href !== "/free-session") : nav;
  const learnerNav = isEnrolled ? [MY_COURSE_NAV] : [];
  const navItems =
    adminNav.length > 0 ? [...learnerNav, ...baseNav, ...adminNav] : [...learnerNav, ...baseNav];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "whitespace-nowrap text-sm font-medium text-text-secondary hover:text-teal transition-colors";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-background/80 backdrop-blur-sm"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:gap-6 md:px-8">
        <VerlinLogo />

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-x-6 lg:flex">
          {navItems.map((item) =>
            isExternal(item.href) ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <AuthButton />
          {!isEnrolled && (
            <Link href="/free-session" className="hidden md:block">
              <Button size="sm" className="whitespace-nowrap">
                Book Free 2-Hour Session
              </Button>
            </Link>
          )}
          <button
            className="rounded-xl p-2 text-text-secondary hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-b border-border bg-background px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) =>
              isExternal(item.href) ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-sm font-medium text-text-secondary hover:text-teal"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-2 text-sm font-medium text-text-secondary hover:text-teal"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="py-2">
              <AuthButton className="w-full justify-center" />
            </div>
            {!isEnrolled && (
              <Link href="/free-session" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Book Free 2-Hour Session</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}