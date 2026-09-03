import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

import { CreateEventInput } from './dto/create-event.input';
import { DeleteEventInput } from './dto/delete-event.input';
import { EventsFilterInput } from './dto/events-filter.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventModel, EventScope } from './models/event.model';
import { CalendarService } from './calendar.service';

@Resolver(() => EventModel)
@UseGuards(GqlAuthGuard)
export class CalendarResolver {
  constructor(private readonly calendarService: CalendarService) {}

  @Query(() => [EventModel], { name: 'events' })
  async getEvents(
    @CurrentUser() user: { id: string },
    @Args('filter') filter: EventsFilterInput,
  ) {
    return this.calendarService.findMany(user.id, filter);
  }

  @Query(() => EventModel, { name: 'event' })
  async getEvent(
    @CurrentUser() user: { id: string },
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.calendarService.findOne(user.id, id);
  }

  @Mutation(() => EventModel)
  async createEvent(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateEventInput,
  ) {
    return this.calendarService.create(user.id, input);
  }

  @Mutation(() => EventModel)
  async updateEvent(
    @CurrentUser() user: { id: string },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEventInput,
  ) {
    return this.calendarService.update(user.id, id, input);
  }

  @Mutation(() => EventModel)
  @UseGuards(GqlAuthGuard)
  async deleteEvent(
    @CurrentUser() user: { id: string },
    @Args('input') input: DeleteEventInput,
  ) {
    return this.calendarService.delete(
      user.id,
      input.id,
      input.mode,
      input.occurrenceDate,
    );
  }

  @Mutation(() => EventModel)
  async changeEventScope(
    @CurrentUser() user: { id: string },
    @Args('id', { type: () => ID }) id: string,
    @Args('scope', { type: () => EventScope }) scope: EventScope,
  ) {
    return this.calendarService.changeScope(user.id, id, scope);
  }
}
