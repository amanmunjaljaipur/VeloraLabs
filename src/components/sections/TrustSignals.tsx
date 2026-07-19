import { getTrustSignals } from "@/lib/trust-signals";
import { ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";

interface TrustSignalsProps {
  compact?: boolean;
}

export function TrustSignals({ compact = false }: TrustSignalsProps) {
  const trust = getTrustSignals();

  return (
    <section
      className={
        compact ? "section-y" : "section-y border-t border-border bg-[var(--bg-light)]"
      }
      aria-labelledby="trust-signals-heading"
    >
      <div className="container-verlin">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">Trust & authority</p>
          <h2 id="trust-signals-heading" className="section-title">
            {trust.headline}
          </h2>
          <p className="section-subtitle mx-auto text-center">{trust.summary}</p>
        </div>

        <div className="mt-[var(--stack-gap)] grid-editorial sm:grid-cols-3">
          {trust.highlights.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-border bg-card px-4 py-5 text-center shadow-sm transition-colors hover:border-accent-teal/30"
            >
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-[0.8125rem] text-text-secondary">{item.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="section-eyebrow text-center">Find Verlin Labs online</h3>
          <div className="mt-5 grid-editorial md:grid-cols-3">
            {trust.channels.map((channel) => {
              const isExternal = !channel.internal && channel.href.startsWith("http");
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-teal">
                        {channel.category}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">{channel.name}</p>
                    </div>
                    {isExternal ? (
                      <ExternalLink className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                    ) : (
                      <Link2 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {channel.description}
                  </p>
                </>
              );

              const className =
                "block h-full rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent-teal/25";

              return isExternal ? (
                <a
                  key={channel.name}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {inner}
                </a>
              ) : (
                <Link key={channel.name} href={channel.href} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>

        {trust.directories && trust.directories.length > 0 && (
          <div className="mt-10 border-t border-border pt-8">
            <p className="section-eyebrow text-center">Citations & external presence</p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
              {trust.directories.map((entry) => (
                <li key={entry.href}>
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal hover:underline"
                    title={entry.note}
                  >
                    {entry.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
