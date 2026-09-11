import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { subDays } from 'date-fns';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { RelationshipService } from '../relationship/relationship.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { assignedTaskUsers, resolveTaskAssignment } from './task-assignment';
import { activateTask, completeTask } from './task-lifecycle';
import { moveTask } from './task-order';
import {
  assertColumnInCouple,
  findActiveTasks,
  getCoupleMemberIds,
  getTaskSummary,
  getTodayTasks,
} from './task-queries';
import { isOverdue } from './task-recurrence';

type TaskDeleteMode = 'THIS' | 'FOLLOWING';

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TasksService.name);
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipService: RelationshipService,
    private readonly pushService: PushService,
  ) {}

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

    try {
      await this.prisma.task.deleteMany({
        where: {
          completed: true,
          completedAt: {
            not: null,
            lt: threshold,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        'Completed task cleanup failed; check database connectivity and applied migrations',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

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

  async create(dto: CreateTaskDto, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    await assertColumnInCouple(this.prisma, dto.columnId, coupleId);

    const maxOrder = await this.prisma.task.aggregate({
      where: { columnId: dto.columnId },
      _max: { order: true },
    });

    const members = await getCoupleMemberIds(this.prisma, coupleId);
    const assignment = resolveTaskAssignment(dto, userId, members);
    const isRecurring = dto.repeat !== undefined && dto.repeat !== 'NONE';

    const data: Prisma.TaskUncheckedCreateInput = {
      title: dto.title,
      description: dto.description ?? null,
      columnId: dto.columnId,
      coupleId,
      order: (maxOrder._max.order ?? -1) + 1,
      priority: dto.priority ?? false,
      ...assignment,
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

    const task = await this.prisma.task.create({
      data,
      include: {
        completions: {
          select: { userId: true },
        },
      },
    });

    await this.notifyAssigned(
      task,
      assignedTaskUsers(task, members).filter((id) => id !== userId),
      `task-created:${task.id}`,
    );

    return task;
  }

  async findAll(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    return findActiveTasks(this.prisma, coupleId);
  }

  async findOne(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    return this.assertTaskInCouple(taskId, coupleId);
  }

  async update(taskId: string, dto: UpdateTaskDto, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);

    const oldTask = await this.assertTaskInCouple(taskId, coupleId);

    if (dto.columnId) {
      await assertColumnInCouple(this.prisma, dto.columnId, coupleId);
    }

    const members = await getCoupleMemberIds(this.prisma, coupleId);
    const changesAssignment =
      dto.assigneeMode !== undefined ||
      dto.assigneeId !== undefined ||
      dto.rotationFirstAssigneeId !== undefined;
    const assignment = changesAssignment
      ? resolveTaskAssignment(dto, oldTask.createdById, members, oldTask)
      : null;
    const data: Prisma.TaskUncheckedUpdateInput = assignment
      ? { ...assignment }
      : {};

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

    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    if (dto.repeat !== undefined) {
      data.repeat = dto.repeat;
      if (dto.repeat !== 'NONE' && !oldTask.recurringGroupId)
        data.recurringGroupId = randomUUID();
      if (dto.repeat === 'NONE') {
        data.recurringGroupId = null;
        data.occurrenceIndex = 0;
      }
    }

    if (dto.repeatUntil !== undefined) {
      data.repeatUntil = dto.repeatUntil ? new Date(dto.repeatUntil) : null;
    }

    if (dto.repeatConfig !== undefined) {
      data.repeatConfig = dto.repeatConfig
        ? (dto.repeatConfig as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    const oldAssignees = assignedTaskUsers(oldTask, members);
    const newAssignees = assignedTaskUsers(assignment ?? oldTask, members);
    const assignmentChanged =
      oldAssignees.length !== newAssignees.length ||
      oldAssignees.some((id) => !newAssignees.includes(id));
    const updatedTask = await this.prisma.$transaction(async (tx) => {
      if (assignmentChanged && !oldTask.completed)
        await tx.taskCompletion.deleteMany({ where: { taskId } });
      return tx.task.update({
        where: { id: taskId },
        data,
        include: { completions: { select: { userId: true } } },
      });
    });
    if (!updatedTask.completed) {
      await this.notifyAssigned(
        updatedTask,
        newAssignees.filter(
          (id) => id !== userId && !oldAssignees.includes(id),
        ),
        `task-assigned:${taskId}:${randomUUID()}`,
      );
    }

    return updatedTask;
  }

  private async notifyAssigned(task: Task, recipients: string[], key: string) {
    const results = await Promise.allSettled(
      recipients.map((userId) =>
        this.pushService.notifyUser(userId, key, {
          title: 'Вам назначена задача',
          body: task.title,
          url: '/together',
          tag: `task:${task.id}`,
        }),
      ),
    );

    if (results.some((result) => result.status === 'rejected'))
      this.logger.error('Task assignment push failed');
  }

  async moveTask(
    taskId: string,
    columnId: string,
    order: number,
    userId: string,
  ) {
    const coupleId = await this.getUserCoupleId(userId);
    const task = await this.assertTaskInCouple(taskId, coupleId);
    return moveTask(this.prisma, task, columnId, order, coupleId);
  }

  async remove(taskId: string, userId: string, mode: TaskDeleteMode = 'THIS') {
    const coupleId = await this.getUserCoupleId(userId);

    const task = await this.assertTaskInCouple(taskId, coupleId);

    if (task.repeat === 'NONE' || !task.recurringGroupId) {
      return this.prisma.task.delete({
        where: { id: taskId },
      });
    }

    if (isOverdue(task)) {
      return this.prisma.task.delete({
        where: { id: taskId },
      });
    }

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

  async complete(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    const task = await this.assertTaskInCouple(taskId, coupleId);
    return completeTask(this.prisma, task, coupleId, userId);
  }

  async activate(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    const task = await this.assertTaskInCouple(taskId, coupleId);
    return activateTask(this.prisma, task);
  }

  async nudge(taskId: string, userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    await this.assertTaskInCouple(taskId, coupleId);
    const members = await getCoupleMemberIds(this.prisma, coupleId);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Task" WHERE "id" = ${taskId} FOR UPDATE`;
      const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
      if (
        task.createdById !== userId ||
        task.completed ||
        task.assigneeMode === 'BOTH' ||
        !task.assigneeId ||
        task.assigneeId === userId ||
        !members.includes(task.assigneeId)
      ) {
        throw new ForbiddenException(
          'Напомнить может только создатель невыполненной задачи, назначенной партнёру',
        );
      }
      const recent = await tx.nudge.findFirst({
        where: {
          taskId,
          senderId: userId,
          createdAt: { gte: new Date(Date.now() - 3_600_000) },
        },
      });
      if (recent)
        throw new ForbiddenException(
          'Вы уже напомнили об этой задаче. Повторить можно через час.',
        );
      const nudge = await tx.nudge.create({
        data: { taskId, senderId: userId, recipientId: task.assigneeId },
      });
      return { nudge, task };
    });
    try {
      await this.pushService.notifyUser(
        result.nudge.recipientId,
        `task-nudge:${result.nudge.id}`,
        {
          title: 'Партнёр напоминает о задаче',
          body: result.task.title,
          url: '/together',
          tag: `task-nudge:${taskId}`,
        },
      );
    } catch {
      this.logger.error('Task nudge push failed');
    }
    return result.nudge;
  }

  async getTodayTasks(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    return getTodayTasks(this.prisma, coupleId);
  }

  async getSummary(userId: string) {
    const coupleId = await this.getUserCoupleId(userId);
    return getTaskSummary(this.prisma, coupleId, userId);
  }
}
