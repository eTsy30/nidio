import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Repeat, Task } from '@prisma/client';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  startOfDay,
  subDays,
} from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';
import { RelationshipService } from '../relationship/relationship.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type TaskDeleteMode = 'THIS' | 'FOLLOWING';

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipService: RelationshipService,
  ) {}

  // ─── BACKEND CLEANUP ─────────────────────────────────

  onModuleInit() {
    void this.cleanupCompletedTasks();

    this.cleanupTimer = setInterval(
      () => {
        void this.cleanupCompletedTasks();
      },
      24 * 60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private async cleanupCompletedTasks() {
    const threshold = subDays(new Date(), 30);

    await this.prisma.task.deleteMany({
      where: {
        completed: true,
        completedAt: {
          not: null,
          lt: threshold,
        },
      },
    });
  }

  // ─── ACCESS ──────────────────────────────────────────

  private async getUserCoupleId(userId: string): Promise<string> {
    const couple = await this.relationshipService.getCurrentCouple(userId);

    if (!couple) {
      throw new ForbiddenException('User is not in a couple');
    }

    return couple.id;
  }

  private async assertTaskInCouple(
    taskId: string,
    coupleId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.column.boardId) {
      const board = await this.prisma.board.findUnique({
        where: { id: task.column.boardId },
      });

      if (!board || board.coupleId !== coupleId) {
        throw new ForbiddenException('Task does not belong to your couple');
      }
    }

    return task;
  }

  private async getCoupleMemberIds(coupleId: string): Promise<string[]> {
    const members = await this.prisma.coupleMember.findMany({
      where: { coupleId },
      select: { userId: true },
    });

    return members.map((member) => member.userId);
  }

  // ─── RECURRENCE ──────────────────────────────────────

  private computeNextDueAt(currentDueAt: Date, repeat: Repeat): Date {
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

  private computeNextAssignee(task: Task, members: string[]): string | null {
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

  /**
   * Проверяет, является ли dueAt задачей сегодняшнего дня
   * или будущего дня.
   *
   * Для lifecycle задачи важна именно дата, а не время.
   */
  private isFutureTask(dueAt: Date | null): boolean {
    if (!dueAt) {
      return false;
    }

    const today = startOfDay(new Date());
    const taskDate = startOfDay(dueAt);

    return taskDate > today;
  }

  /**
   * Просрочена, если дата задачи уже прошла
   * и экземпляр ещё не выполнен.
   */
  private isOverdue(task: Pick<Task, 'dueAt' | 'completed'>): boolean {
    if (task.completed || !task.dueAt) {
      return false;
    }

    return startOfDay(task.dueAt) < startOfDay(new Date());
  }

  // ─── CRUD ───────────────────────────────────────────

  async create(dto: CreateTaskDto, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const column = await this.prisma.column.findFirst({
      where: {
        id: dto.columnId,
        board: { coupleId },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const maxOrder = await this.prisma.task.aggregate({
      where: { columnId: dto.columnId },
      _max: { order: true },
    });

    const isRecurring = dto.repeat !== undefined && dto.repeat !== 'NONE';

    const data: Prisma.TaskUncheckedCreateInput = {
      title: dto.title,
      description: dto.description ?? null,
      columnId: dto.columnId,
      coupleId,
      order: (maxOrder._max.order ?? -1) + 1,
      priority: dto.priority ?? false,
      assigneeId: dto.assigneeId ?? null,
      assigneeMode: dto.assigneeMode ?? 'ME',
      rotationFirstAssigneeId: dto.rotationFirstAssigneeId ?? null,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      repeat: dto.repeat ?? 'NONE',
      repeatUntil: dto.repeatUntil ? new Date(dto.repeatUntil) : null,
      repeatConfig: dto.repeatConfig
        ? (dto.repeatConfig as Prisma.InputJsonValue)
        : Prisma.DbNull,
      recurringGroupId: isRecurring ? crypto.randomUUID() : null,
      occurrenceIndex: 0,
      createdById: userId,
    };

    return this.prisma.task.create({
      data,
      include: {
        completions: {
          select: { userId: true },
        },
      },
    });
  }

  /**
   * Активные задачи являются режимом по умолчанию.
   *
   * Completed никогда не возвращаются.
   */
  async findAll(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    return this.prisma.task.findMany({
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

  async findOne(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    return this.assertTaskInCouple(taskId, coupleId);
  }

  async update(taskId: string, dto: UpdateTaskDto, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    await this.assertTaskInCouple(taskId, coupleId);

    if (dto.columnId) {
      const column = await this.prisma.column.findFirst({
        where: {
          id: dto.columnId,
          board: { coupleId },
        },
      });

      if (!column) {
        throw new NotFoundException('Column not found');
      }
    }

    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.columnId !== undefined) {
      data.columnId = dto.columnId;
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.assigneeId !== undefined) {
      data.assigneeId = dto.assigneeId;
    }

    if (dto.assigneeMode !== undefined) {
      data.assigneeMode = dto.assigneeMode;
    }

    if (dto.rotationFirstAssigneeId !== undefined) {
      data.rotationFirstAssigneeId = dto.rotationFirstAssigneeId;
    }

    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    if (dto.repeat !== undefined) {
      data.repeat = dto.repeat;
    }

    if (dto.repeatUntil !== undefined) {
      data.repeatUntil = dto.repeatUntil ? new Date(dto.repeatUntil) : null;
    }

    if (dto.repeatConfig !== undefined) {
      data.repeatConfig = dto.repeatConfig
        ? (dto.repeatConfig as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        completions: {
          select: { userId: true },
        },
      },
    });
  }

  async moveTask(
    taskId: string,
    columnId: string,
    order: number,
    userId: string,
  ) {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    if (task.completed) {
      throw new ForbiddenException('Completed task cannot be moved');
    }

    if (this.isOverdue(task)) {
      throw new ForbiddenException('Overdue task cannot be moved');
    }

    if (!Number.isInteger(order) || order < 0) {
      throw new ForbiddenException('Invalid task order');
    }

    const column = await this.prisma.column.findFirst({
      where: {
        id: columnId,
        board: { coupleId },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return this.prisma.$transaction(async (tx) => {
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

  /**
   * Удаление задачи.
   */
  async remove(taskId: string, userId: string, mode: TaskDeleteMode = 'THIS') {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    if (task.repeat === 'NONE' || !task.recurringGroupId) {
      return this.prisma.task.delete({
        where: { id: taskId },
      });
    }

    /**
     * Просроченная recurring-задача всегда удаляется
     * только как текущий экземпляр.
     */
    if (this.isOverdue(task)) {
      return this.prisma.task.delete({
        where: { id: taskId },
      });
    }

    /**
     * Для active/future пользователь может выбрать:
     * "Это и все последующие".
     */
    if (mode === 'FOLLOWING' && task.dueAt) {
      return this.prisma.task.deleteMany({
        where: {
          recurringGroupId: task.recurringGroupId,
          dueAt: {
            gte: task.dueAt,
          },
        },
      });
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  // ─── COMPLETION ─────────────────────────────────────

  async complete(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    /**
     * Будущую задачу нельзя выполнить.
     *
     * Проверяем именно дату, поэтому задача на сегодня
     * разрешена независимо от времени dueAt.
     */
    if (this.isFutureTask(task.dueAt)) {
      throw new ForbiddenException('Нельзя выполнить задачу раньше её даты');
    }

    if (task.completed) {
      return task;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
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

      const members = await tx.coupleMember.findMany({
        where: { coupleId },
        select: { userId: true },
      });

      const memberIds = members.map((member) => member.userId);

      const isBoth = task.assigneeMode === 'BOTH';
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

    /**
     * Следующий экземпляр создаётся только после
     * фактического завершения текущего.
     */
    if (updated.completed && updated.repeat !== 'NONE') {
      await this.createNextOccurrence(updated, coupleId);
    }

    return updated;
  }

  /**
   * Возвращает обычную выполненную задачу
   * обратно в активные.
   *
   * Recurring-задачи намеренно не восстанавливаются.
   *
   * Completion records удаляются, потому что после
   * восстановления задача должна снова считаться
   * невыполненной для всех участников.
   */
  async activate(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    if (!task.completed) {
      return task;
    }

    if (task.repeat !== 'NONE' || task.recurringGroupId !== null) {
      throw new ForbiddenException('Recurring task cannot be activated');
    }

    return this.prisma.$transaction(async (tx) => {
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

  // ─── RECURRING ──────────────────────────────────────

  private async createNextOccurrence(task: Task, coupleId: string) {
    if (!task.dueAt || !task.recurringGroupId) {
      return;
    }

    const nextDueAt = this.computeNextDueAt(task.dueAt, task.repeat);

    if (task.repeatUntil && nextDueAt > task.repeatUntil) {
      return;
    }

    /**
     * В серии может существовать максимум один
     * ближайший будущий экземпляр.
     */
    const existingFuture = await this.prisma.task.findFirst({
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

    const members = await this.getCoupleMemberIds(coupleId);

    const nextAssigneeId = this.computeNextAssignee(task, members);

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

    await this.prisma.task.create({
      data,
    });
  }

  // ─── NUDGE ──────────────────────────────────────────

  async nudge(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    if (task.assigneeId === userId) {
      throw new ForbiddenException('Cannot nudge yourself');
    }

    if (!task.assigneeId) {
      throw new ForbiddenException(
        'Cannot nudge a shared task without assignee',
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recent = await this.prisma.nudge.findFirst({
      where: {
        taskId,
        senderId: userId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recent) {
      throw new ForbiddenException(
        'Nudge already sent recently. Try again later.',
      );
    }

    return this.prisma.nudge.create({
      data: {
        taskId,
        senderId: userId,
        recipientId: task.assigneeId,
      },
    });
  }

  // ─── TODAY INTELLIGENCE ─────────────────────────────

  async getTodayTasks(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return this.prisma.task.findMany({
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

  async getSummary(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [my, partner, both, completedToday] = await Promise.all([
      this.prisma.task.count({
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

      this.prisma.task.count({
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

      this.prisma.task.count({
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

      this.prisma.task.count({
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
}
