import type { Metadata } from "next";

import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Профиль",
    description: "Профиль в Nidio.",
    url: routes.profile,
  });
}

export default function ProfilePage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-8">
      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-soft">
        <h2>Профиль</h2>
        <p className="description mt-3">Раздел находится в разработке.</p>
      </div>
    </main>
  );
}
