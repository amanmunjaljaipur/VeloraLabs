const stats = [
  { value: "3", label: "Learning tracks" },
  { value: "16", label: "Max program days" },
  { value: "2hr", label: "Free intro session" },
  { value: "100%", label: "Clarity-first approach" },
];

export function StatsBar() {
  return (
    <section className="py-12 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-semibold text-teal">{stat.value}</p>
              <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}