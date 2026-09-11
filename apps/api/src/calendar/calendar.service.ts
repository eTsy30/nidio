import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Event,
  EventRepeat,
  EventScope as PrismaEventScope,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { validTimeZone } from '../push/calendar-notification-time';
import { CalendarPushService } from '../push/calendar-push.service';

import {
  expandRecurringEvent,
  isRecurringOccurrence,
} from './domain/event-occurrences';
import { eventRangeWhere } from './domain/event-range-query';
import { previousOccurrence } from './domain/recurrence';
import { CreateEventInput } from './dto/create-event.input';
import { EventsFilterInput } from './dto/events-filter.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventScope as GraphQLEventScope } from './models/event.model';
import { EventDeleteMode } from './models/event-delete-mode';
import {
  CalendarEvent,
  mapEventUpdate,
  toGraphQLScope,
  toPrismaScope,
} from './calendar-event.mapper';

const MAX_CALENDAR_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarPush: CalendarPushService,
  ) {}

  async findMany(
    userId: string,
    filter: EventsFilterInput,
  ): Promise<CalendarEvent[]> {
    const startFrom = filter.startFrom ?? new Date(0);

    const startTo =
      filter.startTo ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(startFrom.getTime()) || Number.isNaN(startTo.getTime())) {
      throw new Error('Некорректный диапазон календаря');
    }

    if (startFrom > startTo) {
      throw new Error('startFrom не может быть больше startTo');
    }

    if (startTo.getTime() - startFrom.getTime() > MAX_CALENDAR_RANGE_MS) {
      throw new BadRequestException(
        'Диапазон календаря не может превышать один год',
      );
    }

    const where: Prisma.EventWhereInput = {};

    if (filter.scope === GraphQLEventScope.PERSONAL) {
      where.userId = userId;
    } else {
      const member = await this.prisma.coupleMember.findUnique({
        where: {
          userId,
        },
      });

      if (!member) {
        return [];
      }

      where.coupleId = member.coupleId;
    }

    const events = await this.prisma.event.findMany({
      where: {
        AND: [where, eventRangeWhere(startFrom, startTo)],
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    const result: CalendarEvent[] = [];

    for (const event of events) {
      if (event.repeat === EventRepeat.NONE) {
        result.push({
          ...event,
          seriesId: event.id,
        });
        continue;
      }

      result.push(...expandRecurringEvent(event, startFrom, startTo));
    }

    return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async findOne(userId: string, id: string): Promise<CalendarEvent> {
    const event = await this.findAccessibleEvent(userId, id);

    return {
      ...event,
      seriesId: event.id,
    };
  }

  async create(
    userId: string,
    input: CreateEventInput,
  ): Promise<CalendarEvent> {
    if (input.timeZone && !validTimeZone(input.timeZone))
      throw new BadRequestException('Некорректный часовой пояс');
    const scope = toPrismaScope(input.scope);

    const data: Prisma.EventCreateInput = {
      title: input.title,
      timeZone: input.timeZone ?? null,

      description: input.description ?? null,

      startAt: input.startAt,

      endAt: input.endAt ?? null,

      allDay: input.allDay ?? false,

      type: input.type,

      scope,

      repeat: input.repeat ?? EventRepeat.NONE,

      reminderAt: input.reminderAt ?? null,

      repeatUntil: input.repeatUntil ?? null,

      excludedDates: [],

      createdBy: {
        connect: {
          id: userId,
        },
      },
    };

    if (scope === PrismaEventScope.PERSONAL) {
      data.user = {
        connect: {
          id: userId,
        },
      };
    } else {
      const member = await this.prisma.coupleMember.findUnique({
        where: {
          userId,
        },
      });

      if (!member) {
        throw new ForbiddenException('Вы не состоите в паре');
      }

      data.couple = {
        connect: {
          id: member.coupleId,
        },
      };
    }

    return this.prisma.event.create({
      data,
    });
  }

  async update(
    userId: string,
    id: string,
    incomingInput: UpdateEventInput,
  ): Promise<CalendarEvent> {
    let input = incomingInput;
    const event = await this.findAccessibleEvent(userId, id);

    if (input.timeZone && !validTimeZone(input.timeZone))
      throw new BadRequestException('Некорректный часовой пояс');
    if (input.occurrenceDate && event.repeat !== EventRepeat.NONE) {
      if (!isRecurringOccurrence(event, input.occurrenceDate))
        throw new BadRequestException('Некорректный экземпляр серии');
      const offset = input.occurrenceDate.getTime() - event.startAt.getTime();
      input = {
        ...input,
        ...(input.startAt
          ? { startAt: new Date(input.startAt.getTime() - offset) }
          : {}),
        ...(input.endAt
          ? { endAt: new Date(input.endAt.getTime() - offset) }
          : {}),
        ...(input.reminderAt
          ? { reminderAt: new Date(input.reminderAt.getTime() - offset) }
          : {}),
      };
    }
    const data = mapEventUpdate(input);
    if (
      input.scope !== undefined &&
      input.scope !== toGraphQLScope(event.scope)
    ) {
      const scope = toPrismaScope(input.scope);

      data.scope = scope;

      if (scope === PrismaEventScope.PERSONAL) {
        data.user = {
          connect: {
            id: userId,
          },
        };

        data.couple = {
          disconnect: true,
        };
      } else {
        const member = await this.prisma.coupleMember.findUnique({
          where: {
            userId,
          },
        });

        if (!member) {
          throw new ForbiddenException('Вы не состоите в паре');
        }

        data.couple = {
          connect: {
            id: member.coupleId,
          },
        };

        data.user = {
          disconnect: true,
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({ where: { id }, data });
      const timeChanged =
        updated.startAt.getTime() !== event.startAt.getTime() ||
        updated.endAt?.getTime() !== event.endAt?.getTime() ||
        updated.allDay !== event.allDay;
      if (timeChanged && updated.scope === PrismaEventScope.COUPLE) {
        await this.calendarPush.enqueueChange(
          tx,
          updated,
          userId,
          'Партнёр изменил время события',
          '',
          updated.updatedAt.toISOString(),
        );
      }
      return updated;
    });
  }

  async delete(
    userId: string,
    id: string,
    mode: EventDeleteMode = EventDeleteMode.ALL,
    occurrenceDate?: Date,
  ): Promise<CalendarEvent> {
    const event = await this.findAccessibleEvent(userId, id);

    if (event.repeat === EventRepeat.NONE) {
      return this.deleteWithNotification(event, userId, mode);
    }

    if (
      (mode === EventDeleteMode.THIS || mode === EventDeleteMode.FOLLOWING) &&
      !occurrenceDate
    ) {
      throw new ForbiddenException(
        'Для повторяющегося события необходимо указать occurrenceDate',
      );
    }

    if (mode === EventDeleteMode.ALL) {
      return this.deleteWithNotification(event, userId, mode);
    }

    const occurrence = new Date(occurrenceDate!);

    if (Number.isNaN(occurrence.getTime())) {
      throw new ForbiddenException('Некорректная дата повторения');
    }

    const isOccurrence = isRecurringOccurrence(event, occurrence);

    if (!isOccurrence) {
      throw new ForbiddenException(
        'Указанная дата не является повторением этого события',
      );
    }

    if (mode === EventDeleteMode.THIS) {
      const excludedDates = [...event.excludedDates];

      const alreadyExcluded = excludedDates.some(
        (date) => date.getTime() === occurrence.getTime(),
      );

      if (!alreadyExcluded) {
        excludedDates.push(occurrence);
      }

      if (alreadyExcluded) return event;
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.event.update({
          where: { id },
          data: { excludedDates, notificationDirty: true },
        });
        await this.calendarPush.enqueueChange(
          tx,
          event,
          userId,
          'Партнёр отменил событие',
          'только выбранное повторение',
          `THIS:${occurrence.toISOString()}`,
        );
        return updated;
      });
    }

    // FOLLOWING ends the series at the previous occurrence.
    if (mode === EventDeleteMode.FOLLOWING) {
      const repeatUntil = previousOccurrence(occurrence, event.repeat);

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.event.update({
          where: { id },
          data: { repeatUntil, notificationDirty: true },
        });
        await this.calendarPush.enqueueChange(
          tx,
          event,
          userId,
          'Партнёр отменил события',
          'выбранное и все последующие повторения',
          `FOLLOWING:${occurrence.toISOString()}`,
        );
        return updated;
      });
    }

    return event;
  }

  private async deleteWithNotification(
    event: Event,
    actorId: string,
    mode: EventDeleteMode,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.scheduledNotification.deleteMany({
        where: {
          sourceId: event.id,
          kind: { in: ['EVENT_REMINDER', 'EVENT_DAY'] },
        },
      });
      const deleted = await tx.event.delete({ where: { id: event.id } });
      await this.calendarPush.enqueueChange(
        tx,
        event,
        actorId,
        'Партнёр отменил событие',
        event.repeat === EventRepeat.NONE ? '' : 'вся серия',
        `DELETE:${mode}`,
      );
      return deleted;
    });
  }

  async changeScope(
    userId: string,
    id: string,
    scope: GraphQLEventScope,
  ): Promise<CalendarEvent> {
    return this.update(userId, id, {
      scope,
    });
  }

  private async findAccessibleEvent(userId: string, id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Событие не найдено');
    await this.checkAccess(userId, event);
    return event;
  }

  private async checkAccess(
    userId: string,
    event: {
      scope: PrismaEventScope;
      userId: string | null;
      coupleId: string | null;
    },
  ): Promise<void> {
    if (event.scope === PrismaEventScope.PERSONAL) {
      if (event.userId !== userId) {
        throw new ForbiddenException('Нет доступа к личному событию');
      }

      return;
    }

    const member = await this.prisma.coupleMember.findUnique({
      where: {
        userId,
      },
    });

    if (!member || member.coupleId !== event.coupleId) {
      throw new ForbiddenException('Нет доступа к событию пары');
    }
  }
}
