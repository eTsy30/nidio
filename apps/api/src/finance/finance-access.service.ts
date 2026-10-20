import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
@Injectable()
export class FinanceAccess {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}
  async couple(db: Prisma.TransactionClient, userId: string) {
    if (!userId) throw new ForbiddenException('Нужна авторизация');
    const member = await db.coupleMember.findFirst({
      where: { userId, couple: { deletedAt: null } },
    });
    if (!member)
      throw new ForbiddenException('Финансы доступны участникам пары');
    return member.coupleId;
  }
  async read<T>(
    userId: string,
    fn: (db: Prisma.TransactionClient, coupleId: string) => Promise<T>,
  ) {
    return this.prisma.$transaction(
      async (db) => fn(db, await this.couple(db, userId)),
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async write<T>(
    userId: string,
    fn: (db: Prisma.TransactionClient, coupleId: string) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await this.prisma.$transaction(
          async (db) => {
            const coupleId = await this.couple(db, userId);
            // Serializes savings withdrawals and mutations with the same couple.
            await db.$queryRaw`SELECT id FROM "Couple" WHERE id = ${coupleId} FOR UPDATE`;
            const data = await fn(db, coupleId);
            const members = await db.coupleMember.findMany({
              where: { coupleId },
              select: { userId: true },
            });
            return { data, members, coupleId };
          },
          { isolationLevel: 'Serializable' },
        );
        for (const member of result.members)
          this.realtime.emitToUser(member.userId, 'finance.updated', {
            coupleId: result.coupleId,
          });
        return result.data;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 3
        )
          continue;
        throw error;
      }
    }
  }
}
