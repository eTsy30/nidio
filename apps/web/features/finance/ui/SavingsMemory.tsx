import { useFinance } from "../api/FinanceProvider";
import { money } from "../model/money";
import type { Goal } from "../model/types";
export function SavingsMemory({ goal }: { goal: Goal }) {
  const { name } = useFinance();
  const finish = goal.achievements?.find((item) => item.percent === 100);
  if (!finish) return null;
  return (
    <section className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <p className="text-sm text-muted-foreground">Маленькая победа · сохранено в истории</p>
      <h3>{goal.scope === "PERSONAL" ? "Получилось!" : "Мы это сделали!"}</h3>
      <p className="break-words font-semibold">{finish.title ?? goal.title}</p>
      <p className="text-2xl font-semibold tabular-nums">
        {money(finish.amountMinor, finish.currency ?? goal.currency)}
      </p>
      <p className="text-sm">{new Date(finish.date).toLocaleDateString("ru-RU")}</p>
      {finish.contributions?.map((item) => (
        <p key={item.userId} className="text-sm">
          {name(item.userId)}: {money(item.amountMinor, finish.currency ?? goal.currency)}
        </p>
      ))}
      {goal.createdAt && (
        <p className="text-sm text-muted-foreground">
          Путь к цели:{" "}
          {Math.max(
            1,
            Math.ceil(
              (new Date(finish.date).getTime() - new Date(goal.createdAt).getTime()) / 86400000,
            ),
          )}{" "}
          дн.
        </p>
      )}
    </section>
  );
}
