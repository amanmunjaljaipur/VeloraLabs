"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { VerlinLogo } from "@/components/ui/VerlinLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";
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

function NavLink({
  href,
  children,
  active,
  compact,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative shrink-0 font-medium transition-colors duration-150",
        compact ? "rounded-full px-3.5 py-2 text-sm" : "whitespace-nowrap text-sm",
        active
          ? compact
            ? "bg-accent-teal/10 text-accent-teal"
            : "text-accent-teal"
          : compact
            ? "text-text-secondary hover:bg-muted hover:text-foreground"
            : "text-text-secondary hover:text-navy dark:hover:text-foreground"
      )}
    >
      {children}
      {!compact && (
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-0.5 rounded-full bg-accent-teal transition-all duration-150 ease-out",
            active ? "w-full" : "w-0 group-hover:w-full"
          )}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export function Navbar({ nav }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
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

  const isActive = (href: string) => !isExternal(href) && pathname === href;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 ease-out",
        scrolled
          ? "border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-md"
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
                className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-navy"
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

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <AuthButton />
          </div>
          {!isEnrolled && (
            <Link href="/free-session" className="hidden md:block">
              <Button variant="cta" size="sm" className="whitespace-nowrap">
                Book Free Session
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="border-t border-border/60 bg-background/95 lg:hidden">
        <div className="container-verlin flex items-center gap-3 overflow-x-auto py-2.5 scrollbar-hide">
          {navItems.map((item) =>
            isExternal(item.href) ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
              </a>
            ) : (
              <NavLink key={item.href} href={item.href} active={isActive(item.href)} compact>
                {item.label}
              </NavLink>
            )
          )}
        </div>
        <div className="container-verlin flex items-center gap-3 border-t border-border/50 px-0 py-2.5 sm:hidden">
          <AuthButton className="flex-1 justify-center" />
          {!isEnrolled && (
            <Link href="/free-session" className="flex-1">
              <Button variant="cta" size="sm" className="w-full whitespace-nowrap">
                Free Session
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}