import type { Metadata } from "next";

import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Календарь",
    description: "Календарь пары в Nidio.",
    url: routes.calendar,
  });
}

export default function CalendarPage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-8">
      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-soft">
        <h2>Календарь</h2>
        <p className="description mt-3">Раздел находится в разработке.</p>
      </div>
    </main>
  );
}
