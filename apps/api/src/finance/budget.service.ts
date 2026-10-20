import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BudgetDto,
  expenses,
  FinancialEntryDto,
  incomes,
} from './dto/finance.dto';
import { FinanceAccess } from './finance-access.service';
import { validDate } from './finance-rules';
@Injectable()
export class BudgetService {
  constructor(private readonly access: FinanceAccess) {}
  save(userId: string, dto: FinancialEntryDto, id?: string) {
    validDate(dto.date);
    if (!(dto.type === 'INCOME' ? incomes : expenses).includes(dto.category))
      throw new BadRequestException('Категория не соответствует типу операции');
    return this.access.write(userId, async (db, coupleId) => {
      if (!id) {
        const previous = await db.financialTransaction.findUnique({
          where: { coupleId_requestId: { coupleId, requestId: dto.requestId } },
        });
        if (previous) {
          if (
            previous.createdBy !== userId ||
            previous.amountMinor !== dto.amountMinor ||
            previous.type !== dto.type ||
            previous.currency !== dto.currency ||
            previous.category !== dto.category ||
            previous.date !== dto.date ||
            previous.description !== dto.description
          )
            throw new ConflictException(
              'Повторный запрос отличается от сохранённого',
            );
          return previous;
        }
        return db.financialTransaction.create({
          data: { ...dto, coupleId, createdBy: userId },
        });
      }
      const entry = await db.financialTransaction.findFirst({
        where: { id, coupleId },
      });
      if (!entry) throw new NotFoundException('Операция не найдена');
      const { amountMinor, currency, type, category, date, description } = dto;
      const changes = {
        amountMinor,
        currency,
        type,
        category,
        date,
        description,
      };
      return db.financialTransaction.update({ where: { id }, data: changes });
    });
  }
  remove(userId: string, id: string) {
    return this.access.write(userId, async (db, coupleId) => {
      const result = await db.financialTransaction.deleteMany({
        where: { id, coupleId },
      });
      if (!result.count) throw new NotFoundException('Операция не найдена');
      return { success: true };
    });
  }
  limit(userId: string, dto: BudgetDto) {
    return this.access.write(userId, (db, coupleId) =>
      db.budgetLimit.upsert({
        where: {
          coupleId_currency_category_month: {
            coupleId,
            currency: dto.currency,
            category: dto.category,
            month: dto.month,
          },
        },
        create: { ...dto, coupleId },
        update: { amountMinor: dto.amountMinor },
      }),
    );
  }
  removeLimit(userId: string, id: string) {
    return this.access.write(userId, (db, coupleId) =>
      db.budgetLimit.deleteMany({ where: { id, coupleId } }),
    );
  }
}
