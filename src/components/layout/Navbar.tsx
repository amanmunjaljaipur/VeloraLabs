"use client";

import { VeloraLogo } from "@/components/ui/VeloraLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  nav: { label: string; href: string }[];
}

export function Navbar({ nav }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled ? "border-b border-border bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <VeloraLogo />
        <div className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary hover:text-teal transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/free-session" className="hidden sm:block">
            <Button size="sm">Book Free Session</Button>
          </Link>
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
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-sm font-medium text-text-secondary hover:text-teal"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/free-session" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Book Free Session</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}