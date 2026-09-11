import { ForbiddenException } from '@nestjs/common';
import { Task } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { assertColumnInCouple } from './task-queries';
import { isOverdue } from './task-recurrence';

export async function moveTask(
  prisma: PrismaService,
  task: Task,
  columnId: string,
  order: number,
  coupleId: string,
) {
  const taskId = task.id;

  if (task.completed) {
    throw new ForbiddenException('Completed task cannot be moved');
  }

  if (isOverdue(task)) {
    throw new ForbiddenException('Overdue task cannot be moved');
  }

  if (!Number.isInteger(order) || order < 0) {
    throw new ForbiddenException('Invalid task order');
  }

  await assertColumnInCouple(prisma, columnId, coupleId);

  return prisma.$transaction(async (tx) => {
    const sourceColumnId = task.columnId;

    if (sourceColumnId === columnId) {
      const tasks = await tx.task.findMany({
        where: {
          columnId: sourceColumnId,
          id: { not: taskId },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
        },
      });

      const targetOrder = Math.min(order, tasks.length);

      const reorderedIds = [
        ...tasks.slice(0, targetOrder).map((item) => item.id),
        taskId,
        ...tasks.slice(targetOrder).map((item) => item.id),
      ];

      await Promise.all(
        reorderedIds.map((id, index) =>
          tx.task.update({
            where: { id },
            data: {
              order: index,
            },
          }),
        ),
      );
    } else {
      await tx.task.updateMany({
        where: {
          columnId: sourceColumnId,
          order: { gt: task.order },
        },
        data: {
          order: { decrement: 1 },
        },
      });

      const targetTasksCount = await tx.task.count({
        where: {
          columnId,
          id: { not: taskId },
        },
      });

      const targetOrder = Math.min(order, targetTasksCount);

      await tx.task.updateMany({
        where: {
          columnId,
          order: { gte: targetOrder },
        },
        data: {
          order: { increment: 1 },
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId,
          order: targetOrder,
        },
      });
    }

    return tx.task.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        completions: {
          select: { userId: true },
        },
      },
    });
  });
}
