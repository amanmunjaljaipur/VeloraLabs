import { VeloraLogo } from "@/components/ui/VeloraLogo";
import Link from "next/link";

interface FooterProps {
  tagline: string;
  links: { label: string; href: string }[];
  social: { label: string; href: string }[];
}

export function Footer({ tagline, links, social }: FooterProps) {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <VeloraLogo />
            <p className="mt-4 text-sm text-text-secondary leading-relaxed">{tagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground hover:text-teal transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              {social.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-foreground hover:text-teal transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-text-secondary">
          © {new Date().getFullYear()} Velora Labs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}