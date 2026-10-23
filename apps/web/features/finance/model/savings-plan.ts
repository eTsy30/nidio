export type PlanMode = "equal" | "random" | "denominations";
export const MAX_STEPS = 120;

function validTarget(target: number) {
  if (!Number.isSafeInteger(target) || target < 1 || target > 2000000000)
    throw new Error("Укажите положительную цель до 20 000 000");
}

export function createAmounts(
  target: number,
  mode: PlanMode,
  count: number,
  denominations: number[] = [],
  random: () => number = Math.random,
): number[] {
  validTarget(target);
  if (mode === "denominations") {
    const values = [...new Set(denominations)].sort((a, b) => a - b);
    if (!values.length || values.some((n) => !Number.isSafeInteger(n) || n < 1 || n > 2000000000))
      throw new Error("Добавьте хотя бы один положительный номинал");
    const maximum = values[values.length - 1]!;
    if (Math.ceil(target / maximum) > MAX_STEPS)
      throw new Error("Получится больше 120 кнопок. Увеличьте номиналы");
    const amounts: number[] = [];
    let rest = target;
    while (rest > 0) {
      const slots = MAX_STEPS - amounts.length;
      const allowed = values.filter(
        (value) => value <= rest && rest - value <= maximum * (slots - 1),
      );
      const value = allowed.length
        ? allowed[Math.min(allowed.length - 1, Math.floor(random() * allowed.length))]!
        : rest;
      amounts.push(value);
      rest -= value;
    }
    return amounts;
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_STEPS || count > target)
    throw new Error("Выберите от 1 до 120 кнопок, минимум по одной копейке");
  if (mode === "equal") {
    const base = Math.floor(target / count);
    return Array.from({ length: count }, (_, i) => base + (i < target % count ? 1 : 0));
  }
  // Round most buttons to a friendly denomination; only one carries the exact remainder.
  const average = target / count;
  const unit = average >= 100000 ? 10000 : average >= 10000 ? 1000 : average >= 1000 ? 100 : 1;
  const units = Math.floor(target / unit);
  const weights = Array.from({ length: count }, () => 1 + Math.floor(random() * 9));
  const total = weights.reduce((sum, n) => sum + n, 0);
  const amounts = weights.map(
    (weight) => (1 + Math.floor(((units - count) * weight) / total)) * unit,
  );
  let rest = target - amounts.reduce((sum, n) => sum + n, 0);
  for (let i = 0; rest >= unit; i++, rest -= unit) amounts[i % count]! += unit;
  amounts[amounts.length - 1]! += rest;
  return amounts;
}
