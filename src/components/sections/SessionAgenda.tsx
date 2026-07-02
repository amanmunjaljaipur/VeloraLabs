import { Card } from "@/components/ui/Card";

interface SessionAgendaProps {
  agenda: { time: string; title: string; description: string }[];
}

export function SessionAgenda({ agenda }: SessionAgendaProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">2-hour session agenda</h2>
          <p className="mt-3 text-text-secondary">
            Every minute is structured for understanding — with room for your questions.
          </p>
        </div>
        <div className="mt-10 max-w-3xl">
          <div className="relative space-y-0">
            <div
              className="absolute left-5 top-3 bottom-3 w-px bg-border md:left-6"
              aria-hidden="true"
            />
            {agenda.map((item, i) => (
              <div key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal/30 bg-card text-xs font-semibold text-teal md:h-12 md:w-12">
                  {item.time}
                </div>
                <Card className="flex-1 py-5">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}