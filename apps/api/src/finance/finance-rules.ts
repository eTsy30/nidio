import { BadRequestException } from '@nestjs/common';
export function validDate(value?: string | null) {
  if (value == null) return;
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException('Укажите существующую дату');
}
export function savingsBalance(
  entries: {
    amountMinor: number;
    type: string;
    cancelledAt?: Date | string | null;
  }[],
) {
  return entries.reduce(
    (sum, item) =>
      sum +
      (item.cancelledAt
        ? 0
        : item.type === 'DEPOSIT'
          ? item.amountMinor
          : -item.amountMinor),
    0,
  );
}
export function validEan13(value: string) {
  if (!/^\d{13}$/.test(value)) return false;
  return (
    [...value].reduce(
      (sum, digit, i) => sum + Number(digit) * (i % 2 ? 3 : 1),
      0,
    ) %
      10 ===
    0
  );
}
