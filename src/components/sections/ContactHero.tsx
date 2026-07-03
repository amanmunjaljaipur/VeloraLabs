import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-navy/5 via-background to-accent-teal/5">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-accent-teal">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Let&apos;s talk about clarity-first learning
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            Whether you&apos;re booking a session, exploring team programs, or pitching a
            partnership — we respond thoughtfully and without pressure.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#contact-form">
              <Button size="lg" className="w-full sm:w-auto">
                Send a message
              </Button>
            </Link>
            <Link href="/free-session">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Book free session
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border shadow-xl lg:max-w-none">
          <Image
            src="/images/contact-hero.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}