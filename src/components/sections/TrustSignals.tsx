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
      className={compact ? "py-10 md:py-12" : "section-y border-t border-border bg-muted/15"}
      aria-labelledby="trust-signals-heading"
    >
      <div className="container-verlin">
        <div className={compact ? "max-w-4xl mx-auto" : "max-w-5xl mx-auto"}>
          <p className="section-eyebrow text-center">Trust & authority</p>
          <h2 id="trust-signals-heading" className="section-title mt-3 text-center">
            {trust.headline}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-text-secondary md:text-base">
            {trust.summary}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {trust.highlights.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border border-border bg-card px-4 py-5 text-center shadow-sm transition-colors hover:border-accent-teal/30"
              >
                <p className="text-lg font-semibold tracking-tight text-foreground">{item.value}</p>
                <p className="mt-1 text-[0.8125rem] text-text-secondary">{item.label}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-text-secondary">
              Find Verlin Labs online
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {trust.channels.map((channel) => {
                const isExternal = !channel.internal && channel.href.startsWith("http");
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-accent-teal">
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
                  "block h-full rounded-[1.125rem] border border-border/70 bg-card p-5 transition-colors hover:border-accent-teal/25";

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
            <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-card/50 px-5 py-4">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Citations & external presence
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
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
      </div>
    </section>
  );
}