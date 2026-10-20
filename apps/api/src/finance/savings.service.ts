import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GoalDto, SavingsEntryDto } from './dto/finance.dto';
import { FinanceAccess } from './finance-access.service';
import { savingsBalance, validDate } from './finance-rules';
@Injectable()
export class SavingsService {
  constructor(private readonly access: FinanceAccess) {}
  save(userId: string, dto: GoalDto, id?: string) {
    validDate(dto.targetDate);
    return this.access.write(userId, async (db, coupleId) => {
      if (!id) return db.savingsGoal.create({ data: { ...dto, coupleId } });
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId },
        include: { _count: { select: { transactions: true } } },
      });
      if (!goal) throw new NotFoundException('Копилка не найдена');
      if (goal.currency !== dto.currency && goal._count.transactions)
        throw new BadRequestException(
          'Нельзя изменить валюту копилки с операциями',
        );
      return db.savingsGoal.update({ where: { id }, data: dto });
    });
  }
  remove(userId: string, id: string) {
    return this.access.write(userId, async (db, coupleId) => {
      const result = await db.savingsGoal.deleteMany({
        where: { id, coupleId },
      });
      if (!result.count) throw new NotFoundException('Копилка не найдена');
      return { success: true };
    });
  }
  entry(userId: string, id: string, dto: SavingsEntryDto) {
    return this.access.write(userId, async (db, coupleId) => {
      const goal = await db.savingsGoal.findFirst({
        where: { id, coupleId },
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
          previous.description !== dto.description
        )
          throw new ConflictException(
            'Повторный запрос отличается от сохранённого',
          );
        return previous;
      }
      const balance = savingsBalance(goal.transactions);
      if (dto.type === 'WITHDRAWAL' && dto.amountMinor > balance)
        throw new BadRequestException('В копилке недостаточно средств');
      if (dto.type === 'DEPOSIT' && balance + dto.amountMinor > 2000000000)
        throw new BadRequestException('Превышена максимальная сумма копилки');
      return db.savingsTransaction.create({
        data: { ...dto, goalId: id, createdBy: userId },
      });
    });
  }
}
