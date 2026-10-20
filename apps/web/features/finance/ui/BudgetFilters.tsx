import { Input, Select } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { expenseCategories, incomeCategories } from "../model/constants";
export interface BudgetFilterState {
  period: string;
  start: string;
  end: string;
  category: string;
  author: string;
  search: string;
}
export function BudgetFilters({
  value,
  change,
}: {
  value: BudgetFilterState;
  change: (next: Partial<BudgetFilterState>) => void;
}) {
  const { data } = useFinance();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        label="Период"
        value={value.period}
        onChange={(e) => change({ period: e.target.value })}
      >
        <option value="week">Эта неделя</option>
        <option value="month">Этот месяц</option>
        <option value="year">Этот год</option>
        <option value="custom">Выбрать даты</option>
      </Select>
      <Select
        label="Категория"
        value={value.category}
        onChange={(e) => change({ category: e.target.value })}
      >
        <option value="ALL">Все категории</option>
        {Object.entries({ ...expenseCategories, ...incomeCategories }).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        label="Кто добавил"
        value={value.author}
        onChange={(e) => change({ author: e.target.value })}
      >
        <option value="ALL">Оба участника</option>
        {data.members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.firstName}
          </option>
        ))}
      </Select>
      <Input
        label="Поиск по описанию"
        value={value.search}
        onChange={(e) => change({ search: e.target.value })}
        placeholder="Например, ужин"
      />
      {value.period === "custom" && (
        <>
          <Input
            label="С даты"
            type="date"
            required
            value={value.start}
            onChange={(e) => change({ start: e.target.value })}
          />
          <Input
            label="По дату включительно"
            type="date"
            required
            min={value.start}
            value={value.end}
            onChange={(e) => change({ end: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
