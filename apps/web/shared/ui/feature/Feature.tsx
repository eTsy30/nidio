import { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type FeatureProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4",
        "rounded-lg",
        "border border-primary-foreground/15",
        "bg-primary-foreground/10",
        "backdrop-blur-sm",
        "p-5",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center",
          "rounded-xl",
          "bg-primary-foreground/15",
        )}
      >
        {icon}
      </div>

      <div className="space-y-1">
        <h3 className="label text-primary-foreground">{title}</h3>

        <p className="description text-primary-foreground/75">{description}</p>
      </div>
    </div>
  );
}
