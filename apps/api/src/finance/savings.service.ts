import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { GoalDto, SavingsEntryDto, SavingsPlanDto } from './dto/finance.dto';
import { FinanceAccess } from './finance-access.service';
import { savingsBalance, validDate } from './finance-rules';
import { distributeSavings, parsePlan, validatePlan } from './savings-plan';
import { strategyData } from './savings-strategy';
@Injectable()
export class SavingsService {
  constructor(private readonly access: FinanceAccess) {}
  save(userId: string, dto: GoalDto, id?: string) {
    validDate(dto.targetDate);
    return this.access.write(userId, async (db, coupleId) => {
      const fields = { ...dto };
      delete fields.planAmounts;
      if (!id)
        return db.savingsGoal.create({
          data: { ...fields, ...strategyData(dto), coupleId, ownerId: userId },
        });
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
        include: { transactions: true },
      });
      if (!goal) throw new NotFoundException('Копилка не найдена');
      if (goal.currency !== dto.currency && goal.transactions.length)
        throw new BadRequestException(
          'Нельзя изменить валюту копилки с операциями',
        );
      if (dto.scope && dto.scope !== goal.scope)
        throw new BadRequestException('Тип существующей копилки менять нельзя');
      return db.savingsGoal.update({
        where: { id },
        data: { ...fields, ...strategyData(dto, goal) },
      });
    });
  }
  remove(userId: string, id: string) {
    return this.access.write(userId, async (db, coupleId) => {
      const result = await db.savingsGoal.deleteMany({
        where: { id, coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
      });
      if (!result.count) throw new NotFoundException('Копилка не найдена');
      return { success: true };
    });
  }
  entry(userId: string, id: string, dto: SavingsEntryDto) {
    return this.access.write(userId, async (db, coupleId) => {
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
        include: { transactions: true },
      });
      if (!goal) throw new NotFoundException('Копилка не найдена');
      const previous = goal.transactions.find(
        (item) => item.requestId === dto.requestId,
      );
      if (previous) {
        if (
          previous.amountMinor !== dto.amountMinor ||
          previous.type !== dto.type ||
          previous.createdBy !== userId ||
          previous.description !== dto.description ||
          (previous.stepId ?? undefined) !== dto.stepId
        )
          throw new ConflictException(
            'Повторный запрос отличается от сохранённого',
          );
        return previous;
      }
      if (goal.archived)
        throw new BadRequestException('Сначала верните копилку из архива');
      if (dto.stepId) {
        if (goal.strategy !== 'GRID')
          throw new BadRequestException(
            'Стратегия копилки изменилась. Обновите страницу',
          );
        const step = parsePlan(goal.plan).find(
          (item) => item.id === dto.stepId,
        );
        if (
          !step ||
          step.amountMinor !== dto.amountMinor ||
          dto.type !== 'DEPOSIT'
        )
          throw new BadRequestException('Этап не соответствует операции');
        if (
          goal.transactions.some(
            (item) => item.stepId === dto.stepId && !item.cancelledAt,
          )
        )
          throw new ConflictException('Этот этап уже выполнен');
      }
      const balance = savingsBalance(goal.transactions);
      if (dto.type === 'WITHDRAWAL' && dto.amountMinor > balance)
        throw new BadRequestException('В копилке недостаточно средств');
      if (dto.type === 'DEPOSIT' && balance + dto.amountMinor > 2000000000)
        throw new BadRequestException('Превышена максимальная сумма копилки');
      const entry = await db.savingsTransaction.create({
        data: { ...dto, goalId: id, createdBy: userId },
      });
      const nextBalance =
        balance + (dto.type === 'DEPOSIT' ? dto.amountMinor : -dto.amountMinor);
      const achievements = goal.achievements as {
        percent: number;
        date: string;
        amountMinor: number;
      }[];
      const earned = [25, 50, 75, 100].filter(
        (percent) =>
          nextBalance * 100 >= goal.targetMinor * percent &&
          !achievements.some((item) => item.percent === percent),
      );
      if (earned.length)
        await db.savingsGoal.update({
          where: { id },
          data: {
            achievements: [
              ...achievements,
              ...earned.map((percent) => ({
                percent,
                date: new Date().toISOString(),
                amountMinor: nextBalance,
                title: goal.title,
                currency: goal.currency,
                targetMinor: goal.targetMinor,
                contributions: [
                  ...new Set(
                    [...goal.transactions, entry].map((item) => item.createdBy),
                  ),
                ].map((author) => ({
                  userId: author,
                  amountMinor: savingsBalance(
                    [...goal.transactions, entry].filter(
                      (item) => item.createdBy === author,
                    ),
                  ),
                })),
              })),
            ],
          },
        });
      return { ...entry, awarded: earned };
    });
  }
  plan(userId: string, id: string, dto: SavingsPlanDto) {
    return this.access.write(userId, async (db, coupleId) => {
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
        include: { transactions: true },
      });
      if (!goal) throw new NotFoundException('Копилка не найдена');
      const completed = parsePlan(goal.plan).filter((step) =>
        goal.transactions.some(
          (entry) => entry.stepId === step.id && !entry.cancelledAt,
        ),
      );
      const targetMinor = dto.targetMinor ?? goal.targetMinor;
      const remaining =
        targetMinor -
        completed.reduce((sum, step) => sum + step.amountMinor, 0);
      if (goal.archived)
        throw new BadRequestException('Сначала верните копилку из архива');
      if (remaining < 0)
        throw new BadRequestException('Цель меньше выполненных этапов');
      const amounts =
        dto.amounts ??
        (remaining === 0
          ? []
          : distributeSavings(remaining, dto.count, dto.varied));
      if (amounts.length + completed.length > 120)
        throw new BadRequestException(
          'В плане может быть не больше 120 этапов',
        );
      validatePlan(amounts, remaining);
      return db.savingsGoal.update({
        where: { id },
        data: {
          targetMinor,
          strategy: 'GRID',
          plan: [
            ...completed.map((step) => ({
              id: step.id,
              amountMinor: step.amountMinor,
            })),
            ...amounts.map((amountMinor) => ({
              id: randomUUID(),
              amountMinor,
            })),
          ],
        },
      });
    });
  }
  cancel(userId: string, id: string, entryId: string) {
    return this.access.write(userId, async (db, coupleId) => {
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
        include: { transactions: true },
      });
      if (!goal) throw new NotFoundException('Копилка не найдена');
      const entry = goal.transactions.find(
        (item) => item.id === entryId && item.createdBy === userId,
      );
      if (!entry) throw new NotFoundException('Операция не найдена');
      if (entry.cancelledAt) return entry;
      if (
        entry.type === 'WITHDRAWAL' &&
        savingsBalance(goal.transactions) + entry.amountMinor > 2000000000
      )
        throw new BadRequestException('Превышена максимальная сумма копилки');
      if (
        entry.type === 'DEPOSIT' &&
        savingsBalance(goal.transactions) < entry.amountMinor
      )
        throw new BadRequestException(
          'Нельзя отменить взнос: часть средств уже снята',
        );
      return db.savingsTransaction.update({
        where: { id: entry.id },
        data: { cancelledAt: new Date() },
      });
    });
  }
}
