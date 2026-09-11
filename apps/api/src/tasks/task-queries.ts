import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

export async function getCoupleMemberIds(
  prisma: Pick<Prisma.TransactionClient, 'coupleMember'>,
  coupleId: string,
): Promise<string[]> {
  const members = await prisma.coupleMember.findMany({
    where: { coupleId },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
}

export async function findActiveTasks(prisma: PrismaService, coupleId: string) {
  return prisma.task.findMany({
    where: {
      coupleId,
      completed: false,
    },
    orderBy: [
      { priority: 'desc' },
      { dueAt: 'asc' },
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      completions: {
        select: { userId: true },
      },
      column: true,
    },
  });
}

export async function getTodayTasks(prisma: PrismaService, coupleId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  return prisma.task.findMany({
    where: {
      coupleId,
      completed: false,
      OR: [
        {
          dueAt: {
            lt: todayStart,
          },
        },
        {
          dueAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        {
          dueAt: null,
          repeat: {
            not: 'NONE',
          },
        },
      ],
    },
    orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      completions: {
        select: { userId: true },
      },
      column: true,
    },
  });
}

export async function getTaskSummary(
  prisma: PrismaService,
  coupleId: string,
  userId: string,
) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [my, partner, both, completedToday] = await Promise.all([
    prisma.task.count({
      where: {
        coupleId,
        completed: false,
        assigneeId: userId,
        dueAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    prisma.task.count({
      where: {
        coupleId,
        completed: false,
        assigneeId: {
          not: userId,
        },
        assigneeMode: {
          not: 'BOTH',
        },
        dueAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    prisma.task.count({
      where: {
        coupleId,
        completed: false,
        assigneeMode: 'BOTH',
        dueAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    prisma.task.count({
      where: {
        coupleId,
        completed: true,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
  ]);

  return {
    my,
    partner,
    both,
    completedToday,
  };
}

export async function assertColumnInCouple(
  prisma: PrismaService,
  columnId: string,
  coupleId: string,
) {
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { coupleId } },
  });
  if (!column) throw new NotFoundException('Column not found');
  return column;
}
