import { Card } from "@/shared/ui";

import { categoryName } from "../model/constants";
import { money } from "../model/money";
import type { Currency } from "../model/types";
export function ExpenseChart({
  categories: values,
  currency,
}: {
  categories: { category: string; amountMinor: number }[];
  currency: Currency;
}) {
  const categories = new Map(values.map((item) => [item.category, item.amountMinor]));
  const total = [...categories.values()].reduce((a, b) => a + b, 0);
  return (
    <Card padding="sm">
      <h3 className="font-semibold">На что потратили</h3>
      <p className="mt-1 text-xs text-muted-foreground">За выбранный период с учётом фильтров</p>
      {!total ? (
        <p className="py-5 text-sm text-muted-foreground">Расходов пока нет.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {[...categories]
            .sort((a, b) => b[1] - a[1])
            .map(([category, value]) => (
              <li key={category}>
                <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                  <span>{categoryName(category)}</span>
                  <span>
                    {money(value, currency)} · {Math.round((value / total) * 100)}%
                  </span>
                </div>
                <div aria-hidden="true" className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary motion-safe:transition-[width]"
                    style={{ width: `${(value / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
