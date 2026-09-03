import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';

export enum EventType {
  DATE = 'DATE',
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  OTHER = 'OTHER',
}

export enum EventScope {
  PERSONAL = 'PERSONAL',
  COUPLE = 'COUPLE',
}

export enum EventRepeat {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

registerEnumType(EventType, {
  name: 'EventType',
});

registerEnumType(EventScope, {
  name: 'EventScope',
});

registerEnumType(EventRepeat, {
  name: 'EventRepeat',
});

@ObjectType()
export class EventModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  seriesId?: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLISODateTime)
  startAt!: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  endAt?: Date;

  @Field()
  allDay!: boolean;

  @Field(() => EventType)
  type!: EventType;

  @Field(() => EventScope)
  scope!: EventScope;

  @Field(() => EventRepeat)
  repeat!: EventRepeat;

  @Field()
  createdById!: string;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  coupleId?: string;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  reminderAt?: Date;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
