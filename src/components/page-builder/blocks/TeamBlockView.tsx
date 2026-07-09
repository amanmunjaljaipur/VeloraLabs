import { Card } from "@/components/ui/Card";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { TeamBlockProps } from "@/lib/cms/page-builder-types";

export function TeamBlockView({ props }: { props: TeamBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {props.members.map((member, index) => (
          <Card key={`${member.name}-${index}`} className="overflow-hidden p-0">
            {member.image ? (
              <div className="relative aspect-square bg-muted/30">
                <OptimizedImage
                  src={member.image}
                  alt={member.imageAlt || member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ) : null}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
              {member.role ? <p className="text-sm text-teal">{member.role}</p> : null}
              {member.bio ? (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{member.bio}</p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
