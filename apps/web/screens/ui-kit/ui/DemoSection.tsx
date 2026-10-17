import type { ReactNode } from "react";
export function DemoSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 rounded-3xl border border-border bg-card p-4 sm:p-6"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {title}
      </h2>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}
