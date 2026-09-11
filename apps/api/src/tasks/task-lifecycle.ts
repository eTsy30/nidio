import { ForbiddenException } from '@nestjs/common';
import { Task } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { getCoupleMemberIds } from './task-queries';
import { createNextOccurrence, isFutureTask } from './task-recurrence';

export async function completeTask(
  prisma: PrismaService,
  task: Task,
  coupleId: string,
  userId: string,
) {
  const taskId = task.id;

  if (isFutureTask(task.dueAt)) {
    throw new ForbiddenException('Нельзя выполнить задачу раньше её даты');
  }

  if (task.completed) {
    return task;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Task" WHERE "id" = ${taskId} FOR UPDATE`;
    const current = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
    });
    if (current.completed) return null;
    if (isFutureTask(current.dueAt))
      throw new ForbiddenException('Нельзя выполнить задачу раньше её даты');
    if (current.assigneeMode !== 'BOTH' && current.assigneeId !== userId)
      throw new ForbiddenException('Выполнить задачу может только исполнитель');
    const existing = await tx.taskCompletion.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (existing) {
      return null;
    }

    await tx.taskCompletion.create({
      data: {
        taskId,
        userId,
      },
    });

    const count = await tx.taskCompletion.count({
      where: { taskId },
    });

    const memberIds = await getCoupleMemberIds(tx, coupleId);

    const isBoth = current.assigneeMode === 'BOTH';
    const required = isBoth ? memberIds.length : 1;

    if (count >= required) {
      return tx.task.update({
        where: { id: taskId },
        data: {
          completed: true,
          completedAt: new Date(),
        },
        include: {
          completions: {
            select: { userId: true },
          },
        },
      });
    }

    return tx.task.findUnique({
      where: { id: taskId },
      include: {
        completions: {
          select: { userId: true },
        },
      },
    });
  });

  if (!updated) {
    return task;
  }

  if (updated.completed && updated.repeat !== 'NONE') {
    await createNextOccurrence(prisma, updated, coupleId);
  }

  return updated;
}

export async function activateTask(prisma: PrismaService, task: Task) {
  const taskId = task.id;

  if (!task.completed) {
    return task;
  }

  if (task.repeat !== 'NONE' || task.recurringGroupId !== null) {
    throw new ForbiddenException('Recurring task cannot be activated');
  }

  return prisma.$transaction(async (tx) => {
    await tx.taskCompletion.deleteMany({
      where: {
        taskId,
      },
    });

    return tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        completed: false,
        completedAt: null,
      },
      include: {
        completions: {
          select: {
            userId: true,
          },
        },
      },
    });
  });
}
