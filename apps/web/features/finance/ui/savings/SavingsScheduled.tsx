import { parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/shared/ui";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

import { isFinanceAccessError, useFinanceResource } from "../../api/finance-query";
import { money } from "../../model/money";
import { scheduledContribution } from "../../model/savings-strategy";
import type { Goal } from "../../model/types";

import styles from "./savings.module.css";

export function SavingsScheduled({
  goal,
  onDeposit,
}: {
  goal: Goal;
  onDeposit: (amount: number) => void;
}) {
  const period = scheduledContribution(goal);
  const query = useFinanceResource<{ amountMinor: number }>(
    `/goal/${encodeURIComponent(goal.id)}/contribution`,
    { from: parseISO(period.from).toISOString(), to: parseISO(period.next).toISOString() },
  );
  if (query.isPending) return <LoadingState compact label="Расчёт взноса" />;
  if (!query.data || isFinanceAccessError(query.error))
    return (
      <p>
        Не удалось рассчитать взнос.{" "}
        <Button variant="link" onClick={() => void query.refetch()}>
          Повторить
        </Button>
      </p>
    );
  const schedule = scheduledContribution(goal, undefined, query.data.amountMinor);
  return (
    <section className={`${styles.group} space-y-4`} aria-label="Взнос по расписанию">
      {query.isError && <p role="status">Сумма не обновлена. Проверьте подключение.</p>}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        {goal.scheduleEvery === "WEEK" ? "На этой неделе" : "В этом месяце"}
      </div>
      <div>
        <h2 className="text-xl font-semibold">
          {!schedule.remaining
            ? "Вы достигли цели"
            : schedule.amountMinor
              ? `Отложить ${money(schedule.amountMinor, goal.currency)}`
              : "Взнос уже внесён"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {schedule.amountMinor
            ? "Сумма готова. Осталось отметить пополнение."
            : schedule.remaining
              ? `Следующий период с ${schedule.next.split("-").reverse().join(".")}`
              : "Можно продолжить копить или сохранить копилку в архиве."}
        </p>
      </div>
      <Button
        fullWidth
        className="shadow-none"
        onClick={() => onDeposit(schedule.amountMinor)}
        disabled={goal.archived}
      >
        {schedule.amountMinor ? "Отметить взнос" : "Отложить ещё"}
      </Button>
    </section>
  );
}
