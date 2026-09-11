import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Event, Prisma, ScheduledNotification } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';

import {
  nextEventNotice,
  nextRelationshipNotice,
  validTimeZone,
} from './calendar-notification-time';
import { NotificationPayload, PushService } from './push.service';

type Tx = Prisma.TransactionClient;
const EPOCH = new Date(0);
const GRACE_MS = 60 * 60 * 1000;

@Injectable()
export class CalendarPushService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(CalendarPushService.name);
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

  async setTimeZone(userId: string, timeZone: string) {
    if (!validTimeZone(timeZone))
      throw new BadRequestException('Некорректный часовой пояс');
    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: {
          id: userId,
          OR: [{ timeZone: null }, { timeZone: { not: timeZone } }],
        },
        data: { timeZone },
      });
      if (!changed.count) return;
      const membership = await tx.coupleMember.findUnique({
        where: { userId },
      });
      await tx.event.updateMany({
        where: {
          OR: [
            { userId },
            { createdById: userId },
            ...(membership ? [{ coupleId: membership.coupleId }] : []),
          ],
        },
        data: { notificationDirty: true },
      });
      if (membership)
        await tx.couple.update({
          where: { id: membership.coupleId },
          data: { notificationDirty: true },
        });
    });
    return { timeZone };
  }

  private async save(
    tx: Tx,
    data: Prisma.ScheduledNotificationUncheckedCreateInput,
  ) {
    await tx.scheduledNotification.upsert({
      where: { key: data.key },
      create: data,
      update: { ...data, leaseUntil: EPOCH, leaseToken: null },
    });
  }

  private eventPlans(
    event: Event,
    userId: string,
    timeZone: string | null,
    from: Date,
  ) {
    const plans: Prisma.ScheduledNotificationUncheckedCreateInput[] = [];
    const zone = timeZone ?? event.timeZone ?? 'UTC';
    const reminder = nextEventNotice(event, 'EVENT_REMINDER', zone, from);
    const day =
      timeZone && (event.type === 'BIRTHDAY' || event.type === 'ANNIVERSARY')
        ? nextEventNotice(event, 'EVENT_DAY', zone, from)
        : null;
    for (const [kind, time] of [
      ['EVENT_REMINDER', reminder],
      ['EVENT_DAY', day],
    ] as const) {
      if (!time) continue;

      const duplicateNoon =
        kind === 'EVENT_DAY' &&
        reminder?.runAt.getTime() === time.runAt.getTime();
      plans.push({
        key: `${kind}:${event.id}:${userId}`,
        kind,
        sourceId: event.id,
        userId,
        coupleId: event.coupleId,
        sourceVersion: event.updatedAt,
        runAt: time.runAt,
        occurrenceAt: time.occurrenceAt,
        payload: {
          title:
            kind === 'EVENT_REMINDER'
              ? 'Напоминание о событии'
              : event.type === 'BIRTHDAY'
                ? 'Сегодня день рождения 🎂'
                : 'Сегодня годовщина ❤️',
          body: event.title,
          url: '/calendar',
          tag: `${kind}:${event.id}:${time.dateKey}`,
          skip: duplicateNoon,
        },
      });
    }
    return plans;
  }

  private async planEvent(tx: Tx, sourceEvent: Event, from: Date) {
    let event = sourceEvent;

    if (!event.timeZone) {
      const creator = await tx.user.findUnique({
        where: { id: event.createdById },
        select: { timeZone: true },
      });
      if (creator?.timeZone) {
        event = { ...event, timeZone: creator.timeZone };
        await tx.event.updateMany({
          where: { id: event.id, timeZone: null },
          data: { timeZone: creator.timeZone, updatedAt: event.updatedAt },
        });
      }
    }

    const users =
      event.scope === 'PERSONAL' && event.userId
        ? await tx.user.findMany({
            where: { id: event.userId },
            select: { id: true, timeZone: true },
          })
        : event.coupleId
          ? (
              await tx.coupleMember.findMany({
                where: {
                  coupleId: event.coupleId,
                  couple: { deletedAt: null },
                },
                include: { user: true },
              })
            ).map((member) => member.user)
          : [];
    const plans = users.flatMap((user) =>
      this.eventPlans(event, user.id, user.timeZone, from),
    );
    await tx.scheduledNotification.deleteMany({
      where: {
        sourceId: event.id,
        kind: { in: ['EVENT_REMINDER', 'EVENT_DAY'] },
        key: { notIn: plans.map((plan) => plan.key) },
      },
    });
    for (const plan of plans) await this.save(tx, plan);
  }

  private async planCouple(tx: Tx, coupleId: string, from: Date) {
    const couple = await tx.couple.findUnique({
      where: { id: coupleId },
      include: { members: { include: { user: true } } },
    });
    await tx.scheduledNotification.deleteMany({
      where: { sourceId: coupleId, kind: 'RELATIONSHIP_DAY' },
    });
    if (!couple?.relationshipAt || couple.deletedAt) return;
    for (const member of couple.members) {
      if (!member.user.timeZone) continue;
      const time = nextRelationshipNotice(
        couple.relationshipAt,
        member.user.timeZone,
        from,
      );
      if (!time) continue;
      await this.save(tx, {
        key: `RELATIONSHIP_DAY:${coupleId}:${member.userId}`,
        kind: 'RELATIONSHIP_DAY',
        sourceId: coupleId,
        userId: member.userId,
        coupleId,
        sourceVersion: couple.updatedAt,
        runAt: time.runAt,
        occurrenceAt: time.occurrenceAt,
        payload: {
          title: 'Годовщина ваших отношений ❤️',
          body: 'Сегодня ваша общая дата',
          url: '/profile',
          tag: `relationship:${coupleId}:${time.dateKey}`,
        },
      });
    }
  }

  private async planDirty(now: Date) {
    const from = new Date(now.getTime() - GRACE_MS);
    const events = await this.prisma.event.findMany({
      where: { notificationDirty: true },
      take: 100,
      orderBy: { id: 'asc' },
    });
    for (const event of events)
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.event.updateMany({
          where: {
            id: event.id,
            notificationDirty: true,
            updatedAt: event.updatedAt,
          },
          data: { notificationDirty: false, updatedAt: event.updatedAt },
        });
        if (claimed.count) await this.planEvent(tx, event, from);
      });
    const couples = await this.prisma.couple.findMany({
      where: { notificationDirty: true },
      take: 100,
      orderBy: { id: 'asc' },
    });
    for (const couple of couples)
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.couple.updateMany({
          where: {
            id: couple.id,
            notificationDirty: true,
            updatedAt: couple.updatedAt,
          },
          data: { notificationDirty: false, updatedAt: couple.updatedAt },
        });
        if (claimed.count) await this.planCouple(tx, couple.id, from);
      });
  }

  async enqueueChange(
    tx: Tx,
    event: Event,
    actorId: string,
    title: string,
    details: string,
    suffix: string,
  ) {
    if (event.scope !== 'COUPLE' || !event.coupleId) return;
    const members = await tx.coupleMember.findMany({
      where: {
        coupleId: event.coupleId,
        userId: { not: actorId },
        couple: { deletedAt: null },
      },
    });
    for (const member of members) {
      const key = `EVENT_CHANGE:${event.id}:${suffix}:${member.userId}`;
      await this.save(tx, {
        key,
        kind: 'EVENT_CHANGE',
        sourceId: event.id,
        userId: member.userId,
        coupleId: event.coupleId,
        runAt: new Date(),
        payload: {
          title,
          body: `${event.title}${details ? ` — ${details}` : ''}`,
          url: '/calendar',
          tag: key,
        },
      });
    }
  }

  async tick(now = new Date()) {
    if (this.running) return;
    this.running = true;
    try {
      await this.planDirty(now);
      if (!this.push.publicKey) return;
      const due = await this.prisma.scheduledNotification.findMany({
        where: { runAt: { lte: now }, leaseUntil: { lte: now } },
        orderBy: { runAt: 'asc' },
        take: 100,
      });

      for (let i = 0; i < due.length; i += 10) {
        const results = await Promise.allSettled(
          due.slice(i, i + 10).map((job) => this.process(job, now)),
        );
        if (results.some((result) => result.status === 'rejected'))
          this.logger.error('Calendar push job failed; its lease will expire');
      }
    } catch {
      this.logger.error(
        'Calendar push scheduler failed; check migrations and database connection',
      );
    } finally {
      this.running = false;
    }
  }

  private async process(job: ScheduledNotification, now: Date) {
    const token = randomUUID();
    const claim = await this.prisma.scheduledNotification.updateMany({
      where: {
        id: job.id,
        runAt: job.runAt,
        sourceVersion: job.sourceVersion,
        leaseUntil: { lte: now },
      },
      data: { leaseToken: token, leaseUntil: new Date(Date.now() + 120_000) },
    });
    if (!claim.count) return;
    const user = await this.prisma.user.findUnique({
      where: { id: job.userId },
    });
    let valid = Boolean(user);
    if (job.coupleId)
      valid =
        valid &&
        Boolean(
          await this.prisma.coupleMember.findFirst({
            where: {
              userId: job.userId,
              coupleId: job.coupleId,
              couple: { deletedAt: null },
            },
          }),
        );
    let next: Prisma.ScheduledNotificationUncheckedCreateInput | undefined;
    const after = new Date(Math.max(now.getTime(), job.runAt.getTime()) + 1);
    if (job.kind === 'EVENT_REMINDER' || job.kind === 'EVENT_DAY') {
      const event = await this.prisma.event.findUnique({
        where: { id: job.sourceId },
      });
      valid =
        valid &&
        Boolean(
          event &&
          !event.notificationDirty &&
          event.updatedAt.getTime() === job.sourceVersion?.getTime() &&
          (event.scope === 'PERSONAL'
            ? event.userId === job.userId
            : event.coupleId === job.coupleId),
        );
      if (valid && event && user)
        next = this.eventPlans(event, job.userId, user.timeZone, after).find(
          (plan) => plan.kind === job.kind,
        );
    } else if (job.kind === 'RELATIONSHIP_DAY') {
      const couple = await this.prisma.couple.findUnique({
        where: { id: job.sourceId },
      });
      valid =
        valid &&
        Boolean(
          couple &&
          !couple.notificationDirty &&
          couple.relationshipAt &&
          !couple.deletedAt &&
          couple.updatedAt.getTime() === job.sourceVersion?.getTime() &&
          user?.timeZone,
        );
      if (valid && couple?.relationshipAt && user?.timeZone) {
        const time = nextRelationshipNotice(
          couple.relationshipAt,
          user.timeZone,
          after,
        );
        if (time)
          next = {
            key: job.key,
            kind: job.kind,
            sourceId: job.sourceId,
            userId: job.userId,
            coupleId: job.coupleId,
            sourceVersion: couple.updatedAt,
            runAt: time.runAt,
            occurrenceAt: time.occurrenceAt,
            payload: {
              ...(job.payload as Prisma.JsonObject),
              tag: `relationship:${couple.id}:${time.dateKey}`,
            },
          };
      }
    }
    const payload = job.payload as unknown as NotificationPayload & {
      skip?: boolean;
    };
    if (
      valid &&
      !payload.skip &&
      now.getTime() - job.runAt.getTime() <= GRACE_MS
    ) {
      const deliveryKey =
        job.kind === 'EVENT_REMINDER'
          ? `${job.key}:${job.occurrenceAt?.toISOString()}:${job.runAt.toISOString()}`
          : job.kind === 'EVENT_CHANGE'
            ? job.key
            : `${job.key}:${job.occurrenceAt?.toISOString().slice(0, 10)}`;
      await this.push.notifyUser(job.userId, deliveryKey, payload);
    }
    await this.prisma.$transaction(async (tx) => {
      const removed = await tx.scheduledNotification.deleteMany({
        where: { id: job.id, leaseToken: token },
      });
      if (removed.count && next)
        await tx.scheduledNotification.create({ data: next });
    });
  }
}
