import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  BudgetQuery,
  LimitQuery,
  PageQuery,
  PeriodQuery,
} from './dto/finance-read.dto';
import { FinanceAccess } from './finance-access.service';
import { validDate } from './finance-rules';

const PAGE_SIZE = 50;
type Position = { id: string; createdAt: string; date?: string };
function decodeCursor(value?: string): Position | null {
  if (!value) return null;
  try {
    const p = JSON.parse(
      Buffer.from(value, 'base64url').toString(),
    ) as Position;
    if (
      typeof p.id !== 'string' ||
      !p.id ||
      p.id.length > 100 ||
      typeof p.createdAt !== 'string' ||
      !Number.isFinite(Date.parse(p.createdAt))
    )
      throw new Error();
    if (p.date !== undefined) validDate(p.date);
    return p;
  } catch {
    throw new BadRequestException('Некорректная страница');
  }
}
function page<T extends { id: string; createdAt: Date; date?: string }>(
  rows: T[],
) {
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > PAGE_SIZE && last
        ? Buffer.from(
            JSON.stringify({
              id: last.id,
              createdAt: last.createdAt.toISOString(),
              ...(last.date ? { date: last.date } : {}),
            }),
          ).toString('base64url')
        : null,
  };
}
function sums(rows: { type: string; _sum: { amountMinor: number | null } }[]) {
  const income = rows.find((r) => r.type === 'INCOME')?._sum.amountMinor ?? 0;
  const expense = rows.find((r) => r.type === 'EXPENSE')?._sum.amountMinor ?? 0;
  return { income, expense, balance: income - expense };
}
const goalWhere = (coupleId: string, userId: string) => ({
  coupleId,
  OR: [{ scope: 'COUPLE' }, { ownerId: userId }],
});
@Injectable()
export class FinanceReadService {
  constructor(private readonly access: FinanceAccess) {}

  section(userId: string, section: string, goalId?: string) {
    if (!['cards', 'savings', 'budget'].includes(section))
      throw new BadRequestException('Неизвестный раздел');
    return this.access.read(userId, async (db, coupleId) => {
      const members = await db.coupleMember.findMany({
        where: { coupleId },
        select: {
          savingsColor: true,
          user: { select: { id: true, firstName: true } },
        },
      });
      const cards =
        section === 'cards'
          ? await db.loyaltyCard.findMany({
              where: { coupleId },
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            })
          : [];
      const goals =
        section === 'savings'
          ? await db.savingsGoal.findMany({
              where: {
                ...goalWhere(coupleId, userId),
                ...(goalId ? { id: goalId } : {}),
              },
              orderBy: { createdAt: 'desc' },
            })
          : [];
      const balances = goals.length
        ? await db.savingsTransaction.groupBy({
            by: ['goalId', 'type'],
            where: {
              goalId: { in: goals.map((g) => g.id) },
              cancelledAt: null,
            },
            _sum: { amountMinor: true },
          })
        : [];
      const stepEntries =
        goalId && goals.length
          ? await db.savingsTransaction.findMany({
              where: { goalId, cancelledAt: null, stepId: { not: null } },
            })
          : [];
      return {
        coupleId,
        goals: goals.map((goal) => ({
          ...goal,
          transactions: [],
          stepEntries: goalId ? stepEntries : [],
          currentMinor: balances
            .filter((b) => b.goalId === goal.id)
            .reduce(
              (sum, b) =>
                sum +
                (b.type === 'DEPOSIT' ? 1 : -1) * (b._sum.amountMinor ?? 0),
              0,
            ),
        })),
        cards: cards.map(({ imageKey, ...card }) => ({
          ...card,
          hasImage: Boolean(imageKey),
        })),
        transactions: [],
        limits: [],
        members: members
          .sort((a, b) => a.user.id.localeCompare(b.user.id))
          .map((m, i) => ({
            ...m.user,
            savingsColor: m.savingsColor ?? (i === 0 ? 'primary' : 'success'),
          })),
      };
    });
  }

  budget(userId: string, query: BudgetQuery) {
    validDate(query.start);
    validDate(query.end);
    if (query.start > query.end)
      throw new BadRequestException('Некорректный период');
    const cursor = decodeCursor(query.cursor);
    if (cursor && !cursor.date)
      throw new BadRequestException('Некорректная страница');
    return this.access.read(userId, async (db, coupleId) => {
      const base = { coupleId, currency: query.currency };
      const where: Prisma.FinancialTransactionWhereInput = {
        ...base,
        date: { gte: query.start, lte: query.end },
        ...(query.category && query.category !== 'ALL'
          ? { category: query.category }
          : {}),
        ...(query.author && query.author !== 'ALL'
          ? { createdBy: query.author }
          : {}),
        ...(query.search
          ? { description: { contains: query.search, mode: 'insensitive' } }
          : {}),
      };
      const after: Prisma.FinancialTransactionWhereInput = cursor
        ? {
            OR: [
              { date: { lt: cursor.date! } },
              {
                date: cursor.date!,
                createdAt: { lt: new Date(cursor.createdAt) },
              },
              {
                date: cursor.date!,
                createdAt: new Date(cursor.createdAt),
                id: { lt: cursor.id },
              },
            ],
          }
        : {};
      const rows = await db.financialTransaction.findMany({
        where: { AND: [where, after] },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE + 1,
      });
      // Later pages only contain history; summaries belong to the first page.
      if (cursor) return { ...page(rows), summary: null };
      const previous = new Date(`${query.month}-01T00:00:00Z`);
      previous.setUTCMonth(previous.getUTCMonth() - 1);
      const previousMonth = previous.toISOString().slice(0, 7);
      const [filtered, total, categories, months, count] = await Promise.all([
        db.financialTransaction.groupBy({
          by: ['type'],
          where,
          _sum: { amountMinor: true },
        }),
        db.financialTransaction.groupBy({
          by: ['type'],
          where: base,
          _sum: { amountMinor: true },
        }),
        db.financialTransaction.groupBy({
          by: ['category'],
          where: { ...where, type: 'EXPENSE' },
          _sum: { amountMinor: true },
        }),
        Promise.all(
          [query.month, previousMonth].map((month) =>
            db.financialTransaction.aggregate({
              where: { ...base, type: 'EXPENSE', date: { startsWith: month } },
              _sum: { amountMinor: true },
            }),
          ),
        ),
        db.financialTransaction.count({ where }),
      ]);
      return {
        ...page(rows),
        summary: {
          filtered: sums(filtered),
          total: sums(total),
          categories: categories.map((c) => ({
            category: c.category,
            amountMinor: c._sum.amountMinor ?? 0,
          })),
          thisMonth: months[0]?._sum.amountMinor ?? 0,
          lastMonth: months[1]?._sum.amountMinor ?? 0,
          count,
        },
      };
    });
  }

  limits(userId: string, query: LimitQuery) {
    return this.access.read(userId, async (db, coupleId) => {
      const limits = await db.budgetLimit.findMany({
        where: { coupleId, ...query },
      });
      const spent = await db.financialTransaction.groupBy({
        by: ['category'],
        where: {
          coupleId,
          currency: query.currency,
          type: 'EXPENSE',
          date: { startsWith: query.month },
        },
        _sum: { amountMinor: true },
      });
      return limits.map((l) => ({
        ...l,
        spentMinor: spent
          .filter((s) => l.category === 'ALL' || s.category === l.category)
          .reduce((sum, s) => sum + (s._sum.amountMinor ?? 0), 0),
      }));
    });
  }

  private async requireGoal(
    db: Prisma.TransactionClient,
    coupleId: string,
    userId: string,
    id: string,
  ) {
    const goal = await db.savingsGoal.findFirst({
      where: { id, ...goalWhere(coupleId, userId) },
      select: { id: true },
    });
    if (!goal) throw new NotFoundException('Копилка не найдена');
  }
  history(userId: string, id: string, query: PageQuery) {
    const cursor = decodeCursor(query.cursor);
    return this.access.read(userId, async (db, coupleId) => {
      await this.requireGoal(db, coupleId, userId, id);
      const rows = await db.savingsTransaction.findMany({
        where: {
          goalId: id,
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: new Date(cursor.createdAt) } },
                  {
                    createdAt: new Date(cursor.createdAt),
                    id: { lt: cursor.id },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: PAGE_SIZE + 1,
      });
      return page(rows);
    });
  }
  contribution(userId: string, id: string, query: PeriodQuery) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from >= to || to.getTime() - from.getTime() > 366 * 86400000)
      throw new BadRequestException('Некорректный период');
    return this.access.read(userId, async (db, coupleId) => {
      await this.requireGoal(db, coupleId, userId, id);
      const rows = await db.savingsTransaction.groupBy({
        by: ['type'],
        where: {
          goalId: id,
          cancelledAt: null,
          createdAt: { gte: from, lt: to },
        },
        _sum: { amountMinor: true },
      });
      return {
        amountMinor: rows.reduce(
          (sum, r) =>
            sum + (r.type === 'DEPOSIT' ? 1 : -1) * (r._sum.amountMinor ?? 0),
          0,
        ),
      };
    });
  }
}
