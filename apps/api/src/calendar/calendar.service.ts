import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventRepeat,
  EventScope as PrismaEventScope,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEventInput } from './dto/create-event.input';
import { EventsFilterInput } from './dto/events-filter.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventScope as GraphQLEventScope } from './models/event.model';
import { EventDeleteMode } from './models/event-delete-mode';

type CalendarEvent = {
  id: string;
  seriesId?: string;

  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  repeat: EventRepeat;
  type: string;
  scope: PrismaEventScope;
  createdById: string;
  userId: string | null;
  coupleId: string | null;
  reminderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  repeatUntil: Date | null;
  excludedDates: Date[];
};

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

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
      where,
      orderBy: {
        startAt: 'asc',
      },
    });

    const result: CalendarEvent[] = [];

    for (const event of events) {
      if (event.repeat === EventRepeat.NONE) {
        const insideRange =
          event.startAt >= startFrom && event.startAt <= startTo;

        if (insideRange) {
          result.push({
            ...event,
            seriesId: event.id,
          });
        }

        continue;
      }

      result.push(...this.expandRecurringEvent(event, startFrom, startTo));
    }

    return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async findOne(userId: string, id: string): Promise<CalendarEvent> {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    await this.checkAccess(userId, event);

    return {
      ...event,
      seriesId: event.id,
    };
  }

  async create(
    userId: string,
    input: CreateEventInput,
  ): Promise<CalendarEvent> {
    const scope = this.toPrismaScope(input.scope);

    const data: Prisma.EventCreateInput = {
      title: input.title,

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
    input: UpdateEventInput,
  ): Promise<CalendarEvent> {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    await this.checkAccess(userId, event);

    const data: Prisma.EventUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.startAt !== undefined) {
      data.startAt = input.startAt;
    }

    if (input.endAt !== undefined) {
      data.endAt = input.endAt;
    }

    if (input.allDay !== undefined) {
      data.allDay = input.allDay;
    }

    if (input.type !== undefined) {
      data.type = input.type;
    }

    if (input.repeat !== undefined) {
      data.repeat = input.repeat;
    }

    if (input.reminderAt !== undefined) {
      data.reminderAt = input.reminderAt;
    }

    if (input.repeatUntil !== undefined) {
      data.repeatUntil = input.repeatUntil;
    }

    if (
      input.scope !== undefined &&
      input.scope !== this.toGraphQLScope(event.scope)
    ) {
      const scope = this.toPrismaScope(input.scope);

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

    return this.prisma.event.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(
    userId: string,
    id: string,
    mode: EventDeleteMode = EventDeleteMode.ALL,
    occurrenceDate?: Date,
  ): Promise<CalendarEvent> {
    console.log('[DELETE EVENT]', {
      userId,
      id,
      mode,
      occurrenceDate,
    });

    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    console.log('[DELETE EVENT FOUND]', event?.id);

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    await this.checkAccess(userId, event);

    /*
     * Обычное событие.
     * Для него нет отдельных экземпляров,
     * поэтому удаляем его целиком.
     */
    if (event.repeat === EventRepeat.NONE) {
      return this.prisma.event.delete({
        where: {
          id,
        },
      });
    }

    /*
     * Для THIS и FOLLOWING нужна дата
     * конкретного экземпляра.
     */
    if (
      (mode === EventDeleteMode.THIS || mode === EventDeleteMode.FOLLOWING) &&
      !occurrenceDate
    ) {
      throw new ForbiddenException(
        'Для повторяющегося события необходимо указать occurrenceDate',
      );
    }

    /*
     * Удалить всю серию.
     */
    if (mode === EventDeleteMode.ALL) {
      return this.prisma.event.delete({
        where: {
          id,
        },
      });
    }

    const occurrence = new Date(occurrenceDate!);

    if (Number.isNaN(occurrence.getTime())) {
      throw new ForbiddenException('Некорректная дата повторения');
    }

    /*
     * Проверяем, что указанная дата
     * действительно является экземпляром серии.
     */
    const isOccurrence = this.isRecurringOccurrence(event, occurrence);

    if (!isOccurrence) {
      throw new ForbiddenException(
        'Указанная дата не является повторением этого события',
      );
    }

    /*
     * Удалить только этот экземпляр.
     */
    if (mode === EventDeleteMode.THIS) {
      const excludedDates = [...event.excludedDates];

      const alreadyExcluded = excludedDates.some(
        (date) => date.getTime() === occurrence.getTime(),
      );

      if (!alreadyExcluded) {
        excludedDates.push(occurrence);
      }

      return this.prisma.event.update({
        where: {
          id,
        },
        data: {
          excludedDates,
        },
      });
    }

    /*
     * Удалить этот и все последующие.
     *
     * Например:
     *
     * 1 сентября
     * 2 сентября
     * 3 сентября ← удаляем начиная отсюда
     *
     * repeatUntil = 2 сентября
     */
    if (mode === EventDeleteMode.FOLLOWING) {
      const repeatUntil = this.getPreviousOccurrence(occurrence, event.repeat);

      return this.prisma.event.update({
        where: {
          id,
        },
        data: {
          repeatUntil,
        },
      });
    }

    return event;
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

  private toPrismaScope(scope: GraphQLEventScope): PrismaEventScope {
    switch (scope) {
      case GraphQLEventScope.PERSONAL:
        return PrismaEventScope.PERSONAL;

      case GraphQLEventScope.COUPLE:
        return PrismaEventScope.COUPLE;

      default:
        throw new ForbiddenException('Некорректная область события');
    }
  }

  private toGraphQLScope(scope: PrismaEventScope): GraphQLEventScope {
    switch (scope) {
      case PrismaEventScope.PERSONAL:
        return GraphQLEventScope.PERSONAL;

      case PrismaEventScope.COUPLE:
        return GraphQLEventScope.COUPLE;

      default:
        throw new ForbiddenException('Некорректная область события');
    }
  }

  private expandRecurringEvent(
    event: CalendarEvent,
    rangeStart: Date,
    rangeEnd: Date,
  ): CalendarEvent[] {
    const occurrences: CalendarEvent[] = [];

    let occurrenceStart = new Date(event.startAt);

    const duration = event.endAt
      ? event.endAt.getTime() - event.startAt.getTime()
      : 0;

    let safetyCounter = 0;

    const MAX_OCCURRENCES = 1000;

    while (occurrenceStart <= rangeEnd && safetyCounter < MAX_OCCURRENCES) {
      safetyCounter++;

      /*
       * Серия закончилась.
       */
      if (event.repeatUntil && occurrenceStart > event.repeatUntil) {
        break;
      }

      const insideRange =
        occurrenceStart >= rangeStart && occurrenceStart <= rangeEnd;

      /*
       * Проверяем исключённый экземпляр.
       */
      const isExcluded = event.excludedDates.some(
        (excludedDate) => excludedDate.getTime() === occurrenceStart.getTime(),
      );

      if (insideRange && !isExcluded) {
        const occurrenceEnd = event.endAt
          ? new Date(occurrenceStart.getTime() + duration)
          : null;

        const occurrenceId = `${event.id}-${occurrenceStart.toISOString()}`;

        occurrences.push({
          ...event,
          id: occurrenceId,
          seriesId: event.id,
          startAt: new Date(occurrenceStart),
          endAt: occurrenceEnd,
        });
      }

      const nextOccurrence = this.getNextOccurrence(
        occurrenceStart,
        event.repeat,
      );

      if (nextOccurrence.getTime() <= occurrenceStart.getTime()) {
        break;
      }

      occurrenceStart = nextOccurrence;
    }

    return occurrences;
  }

  /*
   * Все операции recurrence выполняем в UTC.
   *
   * Это важно, потому что Date приходит в ISO UTC,
   * а использование setDate/setMonth зависит
   * от timezone Node.js.
   */
  private getNextOccurrence(date: Date, repeat: EventRepeat): Date {
    const next = new Date(date);

    switch (repeat) {
      case EventRepeat.DAILY:
        next.setUTCDate(next.getUTCDate() + 1);
        break;

      case EventRepeat.WEEKLY:
        next.setUTCDate(next.getUTCDate() + 7);
        break;

      case EventRepeat.MONTHLY:
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;

      case EventRepeat.YEARLY:
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;

      case EventRepeat.NONE:
      default:
        next.setTime(Number.MAX_SAFE_INTEGER);
        break;
    }

    return next;
  }

  private async checkAccess(
    userId: string,
    event: {
      scope: PrismaEventScope;
      userId: string | null;
      coupleId: string | null;
    },
  ): Promise<void> {
    /*
     * Личное событие.
     */
    if (event.scope === PrismaEventScope.PERSONAL) {
      if (event.userId !== userId) {
        throw new ForbiddenException('Нет доступа к личному событию');
      }

      return;
    }

    /*
     * Событие пары.
     */
    const member = await this.prisma.coupleMember.findUnique({
      where: {
        userId,
      },
    });

    if (!member || member.coupleId !== event.coupleId) {
      throw new ForbiddenException('Нет доступа к событию пары');
    }
  }

  private isRecurringOccurrence(
    event: CalendarEvent,
    occurrenceDate: Date,
  ): boolean {
    if (event.repeat === EventRepeat.NONE) {
      return false;
    }

    if (occurrenceDate < event.startAt) {
      return false;
    }

    if (event.repeatUntil && occurrenceDate > event.repeatUntil) {
      return false;
    }

    let current = new Date(event.startAt);

    for (let i = 0; i < 1000; i++) {
      if (current.getTime() === occurrenceDate.getTime()) {
        return true;
      }

      if (current > occurrenceDate) {
        return false;
      }

      const next = this.getNextOccurrence(current, event.repeat);

      if (next.getTime() <= current.getTime()) {
        return false;
      }

      current = next;
    }

    return false;
  }

  private getPreviousOccurrence(date: Date, repeat: EventRepeat): Date {
    const previous = new Date(date);

    switch (repeat) {
      case EventRepeat.DAILY:
        previous.setUTCDate(previous.getUTCDate() - 1);
        break;

      case EventRepeat.WEEKLY:
        previous.setUTCDate(previous.getUTCDate() - 7);
        break;

      case EventRepeat.MONTHLY:
        previous.setUTCMonth(previous.getUTCMonth() - 1);
        break;

      case EventRepeat.YEARLY:
        previous.setUTCFullYear(previous.getUTCFullYear() - 1);
        break;

      case EventRepeat.NONE:
      default:
        return previous;
    }

    return previous;
  }
}
