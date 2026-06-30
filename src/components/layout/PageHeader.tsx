interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 text-lg md:text-xl text-text-secondary leading-relaxed">{subtitle}</p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}