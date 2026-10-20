import type { ReactNode } from "react";

import { Card } from "@/shared/ui/card/Card";
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
    <Card asChild padding="sm" className="sm:p-6">
      <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
        <h2 id={`${id}-title`} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">{description}</p>
        {children}
      </section>
    </Card>
  );
}
