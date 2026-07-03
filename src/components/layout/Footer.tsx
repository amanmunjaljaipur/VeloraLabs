"use client";

import { VerlinLogo } from "@/components/ui/VerlinLogo";
import type { FooterLinkGroup } from "@/lib/site-nav";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface FooterProps {
  tagline: string;
  linkGroups: FooterLinkGroup[];
  social: { label: string; href: string }[];
}

function isExternal(href: string) {
  return href.startsWith("http");
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    "block py-0.5 text-sm text-foreground transition-colors hover:text-teal";

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

function FooterLinkList({
  links,
  hideFreeSession,
}: {
  links: { label: string; href: string }[];
  hideFreeSession?: boolean;
}) {
  const visibleLinks = hideFreeSession
    ? links.filter((link) => link.href !== "/free-session")
    : links;

  return (
    <ul className="flex flex-col gap-2.5">
      {visibleLinks.map((link) => (
        <li key={link.href}>
          <FooterLink href={link.href}>{link.label}</FooterLink>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ tagline, linkGroups, social }: FooterProps) {
  const { data: session } = useSession();
  const isEnrolled = session?.user?.enrolledLearner ?? false;

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container-verlin py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="md:col-span-2 lg:col-span-5">
            <VerlinLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
              {tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-10 md:col-span-2 lg:col-span-4">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {group.title}
                </h3>
                <div className="mt-4">
                  <FooterLinkList
                    links={group.links}
                    hideFreeSession={isEnrolled && group.title === "Learn"}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Connect
            </h3>
            <div className="mt-4">
              <FooterLinkList links={social} />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-sm text-text-secondary md:pt-8">
          © {new Date().getFullYear()} Verlin Labs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}