import { BadRequestException } from '@nestjs/common';
import type { SavingsGoal, SavingsTransaction } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import type { GoalDto } from './dto/finance.dto';
import { savingsBalance, validDate } from './finance-rules';
import { parsePlan, validatePlan } from './savings-plan';

// Creation and strategy changes share one transaction with the goal and its plan.
export function strategyData(
  dto: GoalDto,
  goal?: SavingsGoal & { transactions: SavingsTransaction[] },
) {
  const strategy = dto.strategy ?? goal?.strategy ?? 'FREE';
  const scheduleEvery = dto.scheduleEvery ?? goal?.scheduleEvery ?? null;
  const scheduleAmountMinor = dto.targetDate
    ? null
    : (dto.scheduleAmountMinor ?? goal?.scheduleAmountMinor ?? null);
  const scheduleStartDate =
    dto.scheduleStartDate ??
    goal?.scheduleStartDate ??
    new Date().toISOString().slice(0, 10);
  if (strategy === 'SCHEDULE') {
    validDate(scheduleStartDate);
    if (!scheduleEvery || (!dto.targetDate && !scheduleAmountMinor))
      throw new BadRequestException(
        'Выберите период и укажите сумму взноса или срок',
      );
    if (dto.targetDate && dto.targetDate < scheduleStartDate)
      throw new BadRequestException(
        'Срок не может быть раньше начала накопления',
      );
  }
  const oldPlan = parsePlan(goal?.plan);
  let plan = oldPlan;
  if (dto.planAmounts !== undefined) {
    if (strategy !== 'GRID')
      throw new BadRequestException(
        'Клеточки доступны только для стратегии с сеткой',
      );
    const completed = oldPlan.filter((step) =>
      goal?.transactions.some(
        (entry) => entry.stepId === step.id && !entry.cancelledAt,
      ),
    );
    const remaining = Math.max(
      0,
      dto.targetMinor - savingsBalance(goal?.transactions ?? []),
    );
    validatePlan(dto.planAmounts, remaining);
    if (dto.planAmounts.length + completed.length > 120)
      throw new BadRequestException('В копилке может быть до 120 клеточек');
    plan = [
      ...completed,
      ...dto.planAmounts.map((amountMinor) => ({
        id: randomUUID(),
        amountMinor,
      })),
    ];
  } else if (
    strategy === 'GRID' &&
    (!oldPlan.length || (goal && dto.targetMinor !== goal.targetMinor))
  ) {
    throw new BadRequestException('Обновите предпросмотр сумм для этой цели');
  }
  return {
    strategy,
    plan: plan.map((step) => ({ ...step })),
    gridOrder: dto.gridOrder ?? goal?.gridOrder ?? 'ASC',
    scheduleEvery: strategy === 'SCHEDULE' ? scheduleEvery : null,
    scheduleAmountMinor: strategy === 'SCHEDULE' ? scheduleAmountMinor : null,
    scheduleStartDate: strategy === 'SCHEDULE' ? scheduleStartDate : null,
  };
}
