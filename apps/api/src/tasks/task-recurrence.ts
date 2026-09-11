import { Prisma, Repeat, Task } from '@prisma/client';
import { addDays, addMonths, addWeeks, startOfDay } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

import { getCoupleMemberIds } from './task-queries';

// Todo recurrence uses local calendar dates; calendar events have separate UTC rules.
function computeNextDueAt(currentDueAt: Date, repeat: Repeat): Date {
  switch (repeat) {
    case 'DAILY':
      return addDays(currentDueAt, 1);

    case 'WEEKLY':
      return addWeeks(currentDueAt, 1);

    case 'MONTHLY':
      return addMonths(currentDueAt, 1);

    case 'CUSTOM':
    default:
      return addDays(currentDueAt, 1);
  }
}

function computeNextAssignee(task: Task, members: string[]): string | null {
  if (task.assigneeMode !== 'ROTATE') {
    return task.assigneeId ?? null;
  }

  const firstId = task.rotationFirstAssigneeId;

  if (!firstId || members.length < 2) {
    return task.assigneeId ?? null;
  }

  const partnerId = members.find((id) => id !== firstId);

  if (!partnerId) {
    return firstId;
  }

  const nextIndex = task.occurrenceIndex + 1;

  return nextIndex % 2 === 0 ? firstId : partnerId;
}

export function isFutureTask(dueAt: Date | null): boolean {
  if (!dueAt) {
    return false;
  }

  const today = startOfDay(new Date());
  const taskDate = startOfDay(dueAt);

  return taskDate > today;
}

export function isOverdue(task: Pick<Task, 'dueAt' | 'completed'>): boolean {
  if (task.completed || !task.dueAt) {
    return false;
  }

  return startOfDay(task.dueAt) < startOfDay(new Date());
}

export async function createNextOccurrence(
  prisma: PrismaService,
  task: Task,
  coupleId: string,
) {
  if (!task.dueAt || !task.recurringGroupId) {
    return;
  }

  const nextDueAt = computeNextDueAt(task.dueAt, task.repeat);

  if (task.repeatUntil && nextDueAt > task.repeatUntil) {
    return;
  }

  // Do not create another future occurrence when one already exists.
  const existingFuture = await prisma.task.findFirst({
    where: {
      recurringGroupId: task.recurringGroupId,
      completed: false,
      dueAt: {
        gt: task.dueAt,
      },
    },
    orderBy: {
      dueAt: 'asc',
    },
  });

  if (existingFuture) {
    return;
  }

  const members = await getCoupleMemberIds(prisma, coupleId);

  const nextAssigneeId = computeNextAssignee(task, members);

  const data: Prisma.TaskUncheckedCreateInput = {
    title: task.title,
    description: task.description,
    columnId: task.columnId,
    coupleId,
    order: task.order,
    priority: task.priority,
    assigneeId: nextAssigneeId,
    assigneeMode: task.assigneeMode,
    rotationFirstAssigneeId: task.rotationFirstAssigneeId,
    dueAt: nextDueAt,
    repeat: task.repeat,
    repeatUntil: task.repeatUntil,
    repeatConfig: task.repeatConfig
      ? (task.repeatConfig as Prisma.InputJsonValue)
      : Prisma.DbNull,
    recurringGroupId: task.recurringGroupId,
    occurrenceIndex: task.occurrenceIndex + 1,
    createdById: task.createdById,
  };

  await prisma.task.create({
    data,
  });
}
