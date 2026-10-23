import { BadRequestException } from '@nestjs/common';

export interface PlanStep {
  id: string;
  amountMinor: number;
}
export function distributeSavings(
  target: number,
  count: number,
  varied = false,
): number[] {
  if (
    !Number.isSafeInteger(target) ||
    target < 1 ||
    target > 2000000000 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 120 ||
    count > target
  )
    throw new BadRequestException(
      'Укажите от 1 до 120 этапов с положительными суммами',
    );
  const weights = Array.from({ length: count }, (_, i) =>
    varied ? 1 + (i % 5) : 1,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const remaining = target - count;
  const amounts = weights.map(
    (weight) => 1 + Math.floor((remaining * weight) / total),
  );
  let rest = target - amounts.reduce((sum, amount) => sum + amount, 0);
  for (let i = 0; rest > 0; i++, rest--)
    amounts[i % count] = (amounts[i % count] ?? 0) + 1;
  return amounts;
}
export function parsePlan(value: unknown): PlanStep[] {
  if (!Array.isArray(value)) return [];
  return value as PlanStep[];
}
export function validatePlan(amounts: number[], target: number) {
  if (
    (target !== 0 && !amounts.length) ||
    amounts.length > 120 ||
    amounts.some((n) => !Number.isSafeInteger(n) || n < 1) ||
    amounts.reduce((sum, n) => sum + n, 0) !== target
  )
    throw new BadRequestException(
      'Сумма этапов должна совпадать с оставшейся суммой плана',
    );
}
