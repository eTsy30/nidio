import { Controller, Get, Header, UseGuards } from '@nestjs/common';

import { Authorized as CurrentUser } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { FinanceAccess } from './finance-access.service';
import { savingsBalance } from './finance-rules';
@Controller('finance')
@UseGuards(JwtGuards)
export class FinanceController {
  constructor(private readonly access: FinanceAccess) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  state(@CurrentUser('id') userId: string) {
    return this.access.read(userId, async (db, coupleId) => {
      const [goals, cards, transactions, limits, members] = await Promise.all([
        db.savingsGoal.findMany({
          where: { coupleId },
          include: { transactions: { orderBy: { createdAt: 'desc' } } },
          orderBy: { createdAt: 'desc' },
        }),
        db.loyaltyCard.findMany({
          where: { coupleId },
          orderBy: { createdAt: 'desc' },
        }),
        db.financialTransaction.findMany({
          where: { coupleId },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }),
        db.budgetLimit.findMany({ where: { coupleId } }),
        db.coupleMember.findMany({
          where: { coupleId },
          select: { user: { select: { id: true, firstName: true } } },
        }),
      ]);
      return {
        coupleId,
        goals: goals.map((goal) => ({
          ...goal,
          currentMinor: savingsBalance(goal.transactions),
        })),
        cards: cards.map(({ imageKey, ...card }) => ({
          ...card,
          hasImage: Boolean(imageKey),
        })),
        transactions,
        limits,
        members: members.map((member) => member.user),
      };
    });
  }
}
