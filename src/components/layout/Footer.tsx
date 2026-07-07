"use client";

import { VerlinLogo } from "@/components/ui/VerlinLogo";
import type { FooterLinkGroup } from "@/lib/site-sitemap";
import { cn } from "@/lib/utils";
import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface FooterContact {
  email: string;
  phone?: string;
  location: string;
  responseNote?: string;
}

interface FooterProps {
  tagline: string;
  linkGroups: FooterLinkGroup[];
  social: { label: string; href: string }[];
  contact?: FooterContact;
}

const TRACK_HREFS = new Set([
  "/courses/students",
  "/courses/engineers",
  "/courses/professionals",
]);

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  LinkedIn: LinkedInIcon,
  YouTube: YouTubeIcon,
};

function isExternalHref(href: string) {
  return href.startsWith("http");
}

function isDirectHref(href: string) {
  return (
    href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")
  );
}

function FooterLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const linkClass = cn(
    "inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-accent-teal-light",
    className
  );

  if (isDirectHref(href)) {
    return (
      <a
        href={href}
        className={linkClass}
        {...(isExternalHref(href)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

function FooterNavColumn({
  title,
  links,
  hideFreeSession,
}: {
  title: string;
  links: { label: string; href: string }[];
  hideFreeSession?: boolean;
}) {
  const visibleLinks = hideFreeSession
    ? links.filter((link) => link.href !== "/free-session")
    : links;

  const primaryLinks = visibleLinks.filter((link) => !TRACK_HREFS.has(link.href));
  const trackLinks = visibleLinks.filter((link) => TRACK_HREFS.has(link.href));
  const isPrograms = title === "Programs";

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {primaryLinks.map((link) => (
          <li key={link.href}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
      {isPrograms && trackLinks.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
            By track
          </p>
          <ul className="mt-2.5 flex flex-col gap-2 border-l border-white/10 pl-3">
            {trackLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} className="text-[13px] text-white/60">
                  {link.label}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SocialButton({ href, label }: { href: string; label: string }) {
  const Icon = SOCIAL_ICONS[label];
  if (!Icon) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors hover:border-accent-teal/40 hover:bg-accent-teal/15 hover:text-accent-teal-light"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function Footer({ tagline, linkGroups, social, contact }: FooterProps) {
  const { data: session } = useSession();
  const isEnrolled = session?.user?.enrolledLearner ?? false;

  const socialLinks = social.filter((item) => isExternalHref(item.href));
  const legalLinks = (
    linkGroups.find((group) => group.title === "Legal")?.links ?? []
  ).filter((link) => link.href !== "/sitemap");

  return (
    <footer className="relative border-t border-white/10 bg-navy text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-teal/50 to-transparent"
        aria-hidden
      />

      <div className="container-verlin py-14 md:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4 xl:col-span-4">
            <VerlinLogo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">{tagline}</p>

            {contact && (
              <address className="mt-6 space-y-3 not-italic">
                <FooterLink href={`mailto:${contact.email}`}>
                  <Mail className="h-4 w-4 shrink-0 text-accent-teal-light/80" aria-hidden />
                  <span className="break-all">{contact.email}</span>
                </FooterLink>
                <p className="flex items-start gap-2 text-sm text-white/65">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal-light/80"
                    aria-hidden
                  />
                  {contact.location}
                </p>
                {contact.responseNote && (
                  <p className="text-xs text-white/45">{contact.responseNote}</p>
                )}
              </address>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-2.5">
                {socialLinks.map((item) => (
                  <SocialButton key={item.href} href={item.href} label={item.label} />
                ))}
              </div>
            )}

            <Link
              href="/newsletter"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/85 transition-colors hover:border-accent-teal/35 hover:bg-accent-teal/10 hover:text-accent-teal-light"
            >
              Subscribe to newsletter
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:gap-x-8 lg:col-span-8 lg:grid-cols-4">
            {linkGroups.map((group) => (
              <FooterNavColumn
                key={group.title}
                title={group.title}
                links={group.links}
                hideFreeSession={isEnrolled && group.title === "Programs"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-navy-muted/50">
        <div className="container-verlin flex flex-col items-center justify-between gap-4 py-6 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Verlin Labs. All rights reserved.</p>
          {legalLinks.length > 0 && (
            <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} className="text-xs text-white/50">
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}