import { useFinance } from "../api/FinanceProvider";
import { money } from "../model/money";
import type { Goal } from "../model/types";

export function SavingsContributions({ goal }: { goal: Goal }) {
  const { data, name } = useFinance();
  const members =
    goal.scope === "PERSONAL" ? data.members.filter((m) => m.id === goal.ownerId) : data.members;
  return (
    <div className="grid grid-cols-2 gap-3">
      {members.map((member) => {
        const balance = goal.transactions
          .filter((entry) => entry.createdBy === member.id && !entry.cancelledAt)
          .reduce(
            (sum, entry) =>
              sum + (entry.type === "DEPOSIT" ? entry.amountMinor : -entry.amountMinor),
            0,
          );
        return (
          <div key={member.id} className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">{name(member.id)}</p>
            <p className="font-semibold tabular-nums">{money(balance, goal.currency)}</p>
          </div>
        );
      })}
    </div>
  );
}
