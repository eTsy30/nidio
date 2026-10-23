import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { Authorized as CurrentUser } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { SavingsColorDto } from './dto/finance.dto';
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
          where: { coupleId, OR: [{ scope: 'COUPLE' }, { ownerId: userId }] },
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
          select: {
            savingsColor: true,
            user: { select: { id: true, firstName: true } },
          },
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
        members: members
          .sort((a, b) => a.user.id.localeCompare(b.user.id))
          .map((member, i) => ({
            ...member.user,
            savingsColor:
              member.savingsColor ?? (i === 0 ? 'primary' : 'success'),
          })),
      };
    });
  }
  @Patch('savings-color') color(
    @CurrentUser('id') userId: string,
    @Body() dto: SavingsColorDto,
  ) {
    return this.access.write(userId, (db, coupleId) =>
      db.coupleMember.update({
        where: { coupleId_userId: { coupleId, userId } },
        data: { savingsColor: dto.color },
      }),
    );
  }
}
