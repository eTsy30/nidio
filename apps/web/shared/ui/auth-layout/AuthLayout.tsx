"use client";

import { ReactNode } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import { Feature, FeatureProps } from "../feature/Feature";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  features?: FeatureProps[];
};

export function AuthLayout({ title, description, children, features = [] }: AuthLayoutProps) {
  return (
    <main
      className={cn(
        "min-h-screen",
        "bg-background",
        "flex items-center justify-center",
        "p-4 md:p-8",
      )}
    >
      <section
        className={cn(
          "grid w-full max-w-7xl overflow-hidden",
          "rounded-lg",
          "bg-card",
          "shadow-floating",
          "lg:grid-cols-2",
        )}
      >
        <aside
          className={cn(
            "relative overflow-hidden",
            "hidden lg:flex",
            "flex-col justify-between",
            "bg-primary",
            "p-14",
            "text-primary-foreground",
          )}
        >
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary-foreground/5 blur-3xl" />
          <div className="absolute -left-32 bottom-0 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />

          <div className="relative z-10 space-y-16">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/15">
                <Heart className="size-6 fill-current" />
              </div>

              <span className="heading-md">Nidio</span>
            </div>

            <div className="space-y-8">
              <h2 className="display-sm max-w-sm leading-tight">Пространство для двоих</h2>

              <p className="body-lg max-w-md text-primary-foreground/80">
                Общайтесь, планируйте важные события, сохраняйте воспоминания и оставайтесь ближе
                друг к другу каждый день.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-5">
            {features.map((feature) => (
              <Feature key={feature.title} {...feature} />
            ))}
          </div>
        </aside>

        <div
          className={cn("flex items-center justify-center", "px-6 py-10", "sm:px-10", "lg:px-16")}
        >
          <div className="w-full max-w-lg">
            <div className="mb-12 space-y-3">
              <h2
                className={cn(
                  "display-sm",
                  "max-w",
                  "text-pretty",
                  "leading-[1.1]",
                  "tracking-tight",
                )}
              >
                {title}
              </h2>

              <p className="body-md text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
