import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { EventRepeat, EventScope, EventType } from '../models/event.model';

@InputType()
export class CreateEventInput {
  @Field(() => String)
  @IsString()
  title!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endAt?: Date | null;

  @Field(() => EventType)
  @IsEnum(EventType)
  type!: EventType;

  @Field(() => EventScope)
  @IsEnum(EventScope)
  scope!: EventScope;

  @Field(() => Boolean, {
    defaultValue: false,
  })
  @IsBoolean()
  allDay!: boolean;

  @Field(() => EventRepeat, {
    defaultValue: EventRepeat.NONE,
  })
  @IsEnum(EventRepeat)
  repeat!: EventRepeat;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  reminderAt?: Date | null;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  repeatUntil?: Date | null;
}
