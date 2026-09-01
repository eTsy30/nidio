import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepeat, EventScope } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEventInput } from './dto/create-event.input';
import { EventsFilterInput } from './dto/events-filter.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventScope as GraphQLEventScope } from './models/event.model';

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  repeat: EventRepeat;
  type: string;
  scope: EventScope;
  createdById: string;
  userId: string | null;
  coupleId: string | null;
  reminderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
      filter.startTo ??
      new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    if (Number.isNaN(startFrom.getTime()) || Number.isNaN(startTo.getTime())) {
      throw new Error('Некорректный диапазон календаря');
    }

    if (startFrom > startTo) {
      throw new Error('startFrom не может быть больше startTo');
    }

    const where: Record<string, unknown> = {};

    if (filter.scope === EventScope.PERSONAL) {
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
          result.push(event);
        }

        continue;
      }

      const occurrences = this.expandRecurringEvent(event, startFrom, startTo);

      result.push(...occurrences);
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

    return event;
  }

  async create(
    userId: string,
    input: CreateEventInput,
  ): Promise<CalendarEvent> {
    const data: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      type: input.type,
      scope: input.scope,
      repeat: input.repeat,
      reminderAt: input.reminderAt,
      createdBy: {
        connect: {
          id: userId,
        },
      },
    };

    if (input.scope === EventScope.PERSONAL) {
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
      data: data as never,
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

    const data: Record<string, unknown> = {};

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

    if (input.scope !== undefined && input.scope !== event.scope) {
      data.scope = input.scope;

      if (input.scope === EventScope.PERSONAL) {
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
      data: data as never,
    });
  }

  async delete(userId: string, id: string): Promise<CalendarEvent> {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    await this.checkAccess(userId, event);

    return this.prisma.event.delete({
      where: {
        id,
      },
    });
  }

  async changeScope(
    userId: string,
    id: string,
    scope: GraphQLEventScope,
  ): Promise<CalendarEvent> {
    return this.update(userId, id, {
      scope: scope as unknown as GraphQLEventScope,
    });
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

      const insideRange =
        occurrenceStart >= rangeStart && occurrenceStart <= rangeEnd;

      if (insideRange) {
        const occurrenceEnd = event.endAt
          ? new Date(occurrenceStart.getTime() + duration)
          : null;

        const occurrenceId = `${event.id}-${occurrenceStart.toISOString()}`;

        occurrences.push({
          ...event,
          id: occurrenceId,
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

  private getNextOccurrence(date: Date, repeat: EventRepeat): Date {
    const next = new Date(date);

    switch (repeat) {
      case EventRepeat.DAILY:
        next.setDate(next.getDate() + 1);
        break;

      case EventRepeat.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;

      case EventRepeat.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;

      case EventRepeat.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
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
      scope: EventScope;
      userId: string | null;
      coupleId: string | null;
    },
  ): Promise<void> {
    if (event.scope === EventScope.PERSONAL) {
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
