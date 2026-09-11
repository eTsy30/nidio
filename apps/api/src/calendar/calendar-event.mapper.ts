import { ForbiddenException } from '@nestjs/common';
import {
  EventRepeat,
  EventScope as PrismaEventScope,
  Prisma,
} from '@prisma/client';

import { UpdateEventInput } from './dto/update-event.input';
import { EventScope as GraphQLEventScope } from './models/event.model';

export type CalendarEvent = {
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

export function toPrismaScope(scope: GraphQLEventScope): PrismaEventScope {
  switch (scope) {
    case GraphQLEventScope.PERSONAL:
      return PrismaEventScope.PERSONAL;

    case GraphQLEventScope.COUPLE:
      return PrismaEventScope.COUPLE;

    default:
      throw new ForbiddenException('Некорректная область события');
  }
}

export function toGraphQLScope(scope: PrismaEventScope): GraphQLEventScope {
  switch (scope) {
    case PrismaEventScope.PERSONAL:
      return GraphQLEventScope.PERSONAL;

    case PrismaEventScope.COUPLE:
      return GraphQLEventScope.COUPLE;

    default:
      throw new ForbiddenException('Некорректная область события');
  }
}

export function mapEventUpdate(
  input: UpdateEventInput,
): Prisma.EventUpdateInput {
  const data: Prisma.EventUpdateInput = { notificationDirty: true };
  if (input.timeZone !== undefined) data.timeZone = input.timeZone;

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

  return data;
}
