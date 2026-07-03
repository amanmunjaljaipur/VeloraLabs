"use client";

import { VerlinLogo } from "@/components/ui/VerlinLogo";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface FooterProps {
  tagline: string;
  links: { label: string; href: string }[];
  social: { label: string; href: string }[];
}

function isExternal(href: string) {
  return href.startsWith("http");
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "text-sm text-foreground transition-colors hover:text-teal";

  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function Footer({ tagline, links, social }: FooterProps) {
  const { data: session } = useSession();
  const isEnrolled = session?.user?.enrolledLearner ?? false;
  const visibleLinks = isEnrolled
    ? links.filter((link) => link.href !== "/free-session")
    : links;

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <VerlinLogo />
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{tagline}</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Explore
            </h3>
            <ul className="space-y-3">
              {visibleLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Connect
            </h3>
            <ul className="space-y-3">
              {social.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-text-secondary">
          © {new Date().getFullYear()} Verlin Labs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}