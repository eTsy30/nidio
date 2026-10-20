import { HeartHandshake } from "lucide-react";
export function FinanceEmpty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center">
      <HeartHandshake className="mx-auto mb-3 size-9 text-primary" aria-hidden="true" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
