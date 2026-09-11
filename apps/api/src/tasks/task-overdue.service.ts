import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { startOfDay } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

import { overdueRecipients } from './task-assignment';

@Injectable()
export class TaskOverdueService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(TaskOverdueService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}
  onApplicationBootstrap() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), 60_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(now = new Date()) {
    if (this.running || !this.push.publicKey) return;
    this.running = true;
    try {
      const cutoff = startOfDay(now);
      const candidates = await this.prisma.task.findMany({
        where: {
          completed: false,
          overdueNotifiedAt: null,
          dueAt: { lt: cutoff },
        },
        orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
        take: 100,
      });
      for (const task of candidates) {
        const board = await this.prisma.column.findUnique({
          where: { id: task.columnId },
          include: {
            board: { include: { couple: { include: { members: true } } } },
          },
        });
        const couple = board?.board.couple;
        const members =
          couple && !couple.deletedAt
            ? couple.members.map((member) => member.userId)
            : [];
        const recipients = overdueRecipients(task, members);
        const claim = await this.prisma.task.updateMany({
          where: {
            id: task.id,
            completed: false,
            overdueNotifiedAt: null,
            dueAt: { lt: cutoff },
            updatedAt: task.updatedAt,
          },
          data: { overdueNotifiedAt: now, updatedAt: task.updatedAt },
        });
        if (!claim.count) continue;
        const results = await Promise.allSettled(
          recipients.map((userId) =>
            this.push.notifyUser(userId, `task-overdue:${task.id}`, {
              title: '⚠️ Просроченная задача',
              body: task.title,
              url: '/together',
              tag: `task-overdue:${task.id}`,
            }),
          ),
        );
        if (results.some((result) => result.status === 'rejected'))
          this.logger.error('Unable to send overdue notification');
      }
    } catch {
      this.logger.error(
        'Todo overdue check failed; check database and migrations',
      );
    } finally {
      this.running = false;
    }
  }
}
